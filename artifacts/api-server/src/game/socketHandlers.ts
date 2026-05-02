import { type Server, type Socket } from "socket.io";
import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomBySocket,
  getPlayerBySocket,
  removePlayerBySocket,
  assignImposter,
  assignImposterObjectives,
  assignConstraint,
  resetRound,
  resetRoundKeepCanvas,
  addCanvasElement,
  updateCanvasElement,
  deleteCanvasElement,
  addChatMessage,
  castVote,
  tallyVotes,
  type Room,
  type CanvasElement,
} from "./gameState.js";
import { pickPrompts, PHASE_DURATIONS } from "./rounds.js";
import { logger } from "../lib/logger.js";

function sanitizeRoom(room: Room, forSocketId: string) {
  const player = room.players.find((p) => p.socketId === forSocketId);
  const isImposter = player?.isImposter ?? false;
  const showVotes = room.phase === "results" || room.phase === "ended" || room.phase === "vote";
  const showReveal = room.phase === "results" || room.phase === "ended";

  const myConstraint =
    room.activeConstraint && player?.id === room.activeConstraint.playerId
      ? room.activeConstraint.type
      : undefined;

  return {
    id: room.id,
    phase: room.phase,
    round: room.round,
    maxRounds: room.maxRounds,
    prompt: room.prompt,
    canvas: room.canvas,
    messages: room.messages,
    results: room.results,
    phaseEndTime: room.phaseEndTime,
    imposterId: showReveal ? room.imposterId : undefined,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isHost: p.isHost,
      isImposter: isImposter && p.id === player?.id ? true : false,
      eliminated: p.eliminated,
      score: p.score,
    })),
    myRole: isImposter ? "imposter" : "crewmate",
    votes: showVotes ? room.votes : undefined,
    voteTally: showVotes ? computeTally(room) : undefined,
    doneVotes: room.doneVotes,
    challengeMode: room.challengeMode,
    challengeHint: room.challengeMode && !!room.activeConstraint,
    myConstraint,
    imposterMeta: showReveal ? room.imposterMeta : undefined,
  };
}

function computeTally(room: Room): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(room.votes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  return tally;
}

function broadcastRoom(io: Server, room: Room) {
  for (const player of room.players) {
    io.to(player.socketId).emit("room:state", sanitizeRoom(room, player.socketId));
  }
}

/** Emit imposter objectives + constraint privately after round starts */
function emitPrivateRoundEvents(io: Server, room: Room) {
  const imposterPlayer = room.players.find((p) => p.isImposter);
  if (imposterPlayer && room.imposterMeta) {
    io.to(imposterPlayer.socketId).emit("imposter:objectives", room.imposterMeta);
  }
  if (room.activeConstraint) {
    const constrainedPlayer = room.players.find((p) => p.id === room.activeConstraint!.playerId);
    if (constrainedPlayer) {
      io.to(constrainedPlayer.socketId).emit("constraint:assigned", {
        type: room.activeConstraint.type,
      });
    }
  }
}

const FEEDBACK_LINES = [
  "Some strong contributions, but the layout feels unresolved.",
  "Interesting use of elements — composition could be tighter.",
  "Good variety, though colour choices clash in places.",
  "Solid structure with a few elements that feel out of place.",
  "Typography and shapes work together well overall.",
  "The hierarchy is unclear — someone sabotaged the visual flow.",
  "Nice balance of types, but a couple of elements feel off-brand.",
  "Layout has potential; a rogue element dragged the score down.",
];

function resolveVotePhase(io: Server, room: Room, prompts: string[]) {
  const { mostVoted, hasMajority } = tallyVotes(room);
  const caught = hasMajority && mostVoted === room.imposterId;
  const imposter = room.players.find((p) => p.id === room.imposterId);

  const roundResult = {
    round: room.round,
    prompt: room.prompt,
    scores: {},
    feedback: FEEDBACK_LINES[Math.floor(Math.random() * FEEDBACK_LINES.length)],
    imposterId: room.imposterId,
    caught,
  };
  room.results.push(roundResult);
  room.phase = "results";
  room.phaseEndTime = Date.now() + PHASE_DURATIONS.results * 3;
  broadcastRoom(io, room);

  const nextRound = room.round + 1;
  if (nextRound > room.maxRounds || caught) {
    room.phaseTimer = setTimeout(() => {
      room.phase = "ended";
      broadcastRoom(io, room);
    }, PHASE_DURATIONS.results * 3);
  } else {
    room.phaseTimer = setTimeout(() => {
      room.round = nextRound;
      if (caught) {
        resetRound(room);
      } else {
        resetRoundKeepCanvas(room);
      }
      assignImposter(room);
      assignImposterObjectives(room);
      assignConstraint(room);
      room.phase = "design";
      room.phaseEndTime = Date.now() + PHASE_DURATIONS.design;
      broadcastRoom(io, room);
      emitPrivateRoundEvents(io, room);
      room.phaseTimer = setTimeout(() => advancePhase(io, room, prompts), PHASE_DURATIONS.design);
    }, PHASE_DURATIONS.results * 3);
  }
}

function advancePhase(io: Server, room: Room, prompts: string[]) {
  if (room.phaseTimer) clearTimeout(room.phaseTimer);

  if (room.phase === "lobby") {
    room.phase = "design";
    room.round = 1;
    room.prompt = prompts[0] ?? "Design a beautiful UI";
    resetRound(room);
    assignImposter(room);
    assignImposterObjectives(room);
    assignConstraint(room);
    room.phaseEndTime = Date.now() + PHASE_DURATIONS.design;
    broadcastRoom(io, room);
    emitPrivateRoundEvents(io, room);
    room.phaseTimer = setTimeout(() => advancePhase(io, room, prompts), PHASE_DURATIONS.design);
  } else if (room.phase === "design") {
    room.phase = "chat";
    room.doneVotes = [];
    room.phaseEndTime = Date.now() + PHASE_DURATIONS.chat;
    broadcastRoom(io, room);
    room.phaseTimer = setTimeout(() => advancePhase(io, room, prompts), PHASE_DURATIONS.chat);
  } else if (room.phase === "chat") {
    room.phase = "vote";
    room.votes = {};
    room.doneVotes = [];
    room.phaseEndTime = Date.now() + PHASE_DURATIONS.vote;
    broadcastRoom(io, room);
    room.phaseTimer = setTimeout(() => advancePhase(io, room, prompts), PHASE_DURATIONS.vote);
  } else if (room.phase === "vote") {
    const { mostVoted, hasMajority } = tallyVotes(room);
    const caught = hasMajority && mostVoted === room.imposterId;
    const imposter = room.players.find((p) => p.id === room.imposterId);

    io.to(room.id).emit("vote:result", {
      eliminatedId: hasMajority ? mostVoted : "",
      wasImposter: caught,
      imposterName: imposter?.name ?? "Unknown",
      isTie: !hasMajority,
    });

    room.phaseTimer = setTimeout(() => {
      resolveVotePhase(io, room, prompts);
    }, 4500);
  }
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("room:create", ({ name }: { name: string }) => {
      const room = createRoom(socket.id, name);
      const host = room.players[0];
      socket.join(room.id);
      socket.emit("room:joined", { roomId: room.id, playerId: host.id });
      broadcastRoom(io, room);
    });

    socket.on("room:join", ({ roomId, name }: { roomId: string; name: string }) => {
      const result = joinRoom(roomId.toUpperCase(), socket.id, name);
      if (!result) {
        socket.emit("room:error", { message: "Room not found, full, or already started." });
        return;
      }
      socket.join(roomId.toUpperCase());
      socket.emit("room:joined", { roomId: roomId.toUpperCase(), playerId: result.player.id });
      broadcastRoom(io, result.room);
    });

    socket.on("game:start", () => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player?.isHost) return;
      if (room.players.length < 3) {
        socket.emit("room:error", { message: "Need at least 3 players to start." });
        return;
      }
      const prompts = pickPrompts(room.maxRounds);
      advancePhase(io, room, prompts);
    });

    socket.on("challenge:toggle", ({ enabled }: { enabled: boolean }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player?.isHost || room.phase !== "lobby") return;
      room.challengeMode = enabled;
      broadcastRoom(io, room);
    });

    socket.on("cursor:move", ({ x, y }: { x: number; y: number }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || room.phase !== "design") return;
      socket.to(room.id).emit("cursor:update", { playerId: player.id, x, y });
    });

    socket.on("canvas:add", (element: {
      type: string; x: number; y: number; width: number; height: number;
      content?: string; fill: string; stroke?: string; fontSize?: number;
      points?: { x: number; y: number }[];
      strokeWidth?: number;
      vertices?: { x: number; y: number }[];
    }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || room.phase !== "design") return;
      if (room.canvas.length >= 50) return;

      const el = addCanvasElement(room, {
        type: element.type as CanvasElement["type"],
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        content: element.content,
        fill: element.fill,
        stroke: element.stroke,
        fontSize: element.fontSize,
        points: element.points,
        strokeWidth: element.strokeWidth,
        vertices: element.vertices,
        ownerId: player.id,
      });
      io.to(room.id).emit("canvas:added", el);
    });

    socket.on("canvas:update", ({ elementId, updates }: { elementId: string; updates: object }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || room.phase !== "design") return;
      const el = updateCanvasElement(room, elementId, updates as Record<string, unknown>);
      if (el) io.to(room.id).emit("canvas:updated", el);
    });

    socket.on("canvas:delete", ({ elementId }: { elementId: string }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || room.phase !== "design") return;
      const ok = deleteCanvasElement(room, elementId);
      if (ok) io.to(room.id).emit("canvas:deleted", { elementId });
    });

    socket.on("chat:typing", () => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || room.phase !== "chat") return;
      socket.to(room.id).emit("chat:typing", { playerId: player.id });
    });

    socket.on("chat:send", ({ text }: { text: string }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || room.phase !== "chat") return;
      const msg = addChatMessage(room, player.id, text);
      if (msg) io.to(room.id).emit("chat:message", msg);
    });

    socket.on("vote:cast", ({ targetId }: { targetId: string }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || room.phase !== "vote") return;
      if (room.votes[player.id]) return;
      castVote(room, player.id, targetId);
      const tally = computeTally(room);
      io.to(room.id).emit("vote:update", { votes: tally, totalVoters: room.players.length });
      broadcastRoom(io, room);
      const activePlayers = room.players.filter((p) => !p.eliminated);
      const allVoted = activePlayers.every((p) => room.votes[p.id]);
      if (allVoted) {
        if (room.phaseTimer) clearTimeout(room.phaseTimer);
        advancePhase(io, room, []);
      }
    });

    socket.on("phase:done", () => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player || !["design", "chat"].includes(room.phase)) return;
      if (!room.doneVotes.includes(player.id)) {
        room.doneVotes.push(player.id);
      }
      const activePlayers = room.players.filter((p) => !p.eliminated);
      broadcastRoom(io, room);
      if (room.doneVotes.length > activePlayers.length / 2) {
        if (room.phaseTimer) clearTimeout(room.phaseTimer);
        const prompts = room.results.map((r) => r.prompt).concat(room.prompt ? [room.prompt] : []);
        advancePhase(io, room, prompts);
      }
    });

    socket.on("phase:skip", () => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player?.isHost) return;
      if (room.phase === "design" || room.phase === "chat") {
        if (room.phaseTimer) clearTimeout(room.phaseTimer);
        const prompts = room.results.map((r) => r.prompt).concat(room.prompt ? [room.prompt] : []);
        advancePhase(io, room, prompts);
      }
    });

    socket.on("game:playAgain", () => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player?.isHost) return;
      room.phase = "lobby";
      room.round = 0;
      room.prompt = "";
      room.canvas = [];
      room.messages = [];
      room.votes = {};
      room.results = [];
      room.phaseEndTime = 0;
      room.imposterId = "";
      room.imposterMeta = undefined;
      room.activeConstraint = undefined;
      room.players.forEach((p) => {
        p.isImposter = false;
        p.score = 0;
        p.eliminated = false;
      });
      broadcastRoom(io, room);
    });

    socket.on("voice:chunk", (data: { chunk: ArrayBuffer }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player) return;
      socket.to(room.id).emit("voice:chunk", { playerId: player.id, chunk: data.chunk });
    });

    socket.on("voice:speaking", (data: { active: boolean }) => {
      const room = getRoomBySocket(socket.id);
      const player = room ? getPlayerBySocket(room, socket.id) : undefined;
      if (!room || !player) return;
      socket.to(room.id).emit("voice:speaking", { playerId: player.id, active: data.active });
    });

    socket.on("room:leave", () => {
      const result = removePlayerBySocket(socket.id);
      if (result) {
        const { room } = result;
        if (room.players.length > 0) {
          broadcastRoom(io, room);
        }
      }
      logger.info({ socketId: socket.id }, "Player left room voluntarily");
    });

    socket.on("disconnect", () => {
      const result = removePlayerBySocket(socket.id);
      if (result) {
        const { room } = result;
        if (room.players.length > 0) {
          broadcastRoom(io, room);
        }
      }
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });
}
