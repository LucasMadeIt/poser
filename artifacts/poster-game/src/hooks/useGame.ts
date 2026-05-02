import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { RoomState, CanvasElement } from "../types/game";

export type RemoteCursor = {
  playerId: string;
  x: number;
  y: number;
  lastSeen: number;
};

export type VoteResult = {
  eliminatedId: string;
  wasImposter: boolean;
  imposterName: string;
  isTie: boolean;
};

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
  }
  return sharedSocket;
}

export function useGame() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [voteTally, setVoteTally] = useState<Record<string, number>>({});
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [typingPlayers, setTypingPlayers] = useState<Record<string, number>>({});
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    socket.on("room:state", (state: RoomState) => {
      setRoom(state);
      if (state.voteTally) setVoteTally(state.voteTally);
      // Clear voteResult when phase changes away from vote
      if (state.phase !== "vote") setVoteResult(null);
    });

    socket.on("room:joined", ({ roomId: rid, playerId }: { roomId: string; playerId: string }) => {
      setRoomId(rid);
      setMyPlayerId(playerId);
      setError("");
    });

    socket.on("room:error", ({ message }: { message: string }) => {
      setError(message);
    });

    socket.on("canvas:added", (el: CanvasElement) => {
      setRoom((prev) =>
        prev ? { ...prev, canvas: [...prev.canvas, el] } : prev
      );
    });

    socket.on("canvas:updated", (el: CanvasElement) => {
      setRoom((prev) =>
        prev
          ? { ...prev, canvas: prev.canvas.map((e) => (e.id === el.id ? el : e)) }
          : prev
      );
    });

    socket.on("canvas:deleted", ({ elementId }: { elementId: string }) => {
      setRoom((prev) =>
        prev
          ? { ...prev, canvas: prev.canvas.filter((e) => e.id !== elementId) }
          : prev
      );
    });

    socket.on("chat:message", (msg: RoomState["messages"][0]) => {
      setRoom((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg] } : prev
      );
    });

    socket.on("vote:update", ({ votes }: { votes: Record<string, number> }) => {
      setVoteTally(votes);
    });

    socket.on("vote:result", (result: VoteResult) => {
      setVoteResult(result);
    });

    socket.on("chat:typing", ({ playerId }: { playerId: string }) => {
      setTypingPlayers((prev) => ({ ...prev, [playerId]: Date.now() }));
    });

    // Remote player cursors
    socket.on("cursor:update", ({ playerId, x, y }: { playerId: string; x: number; y: number }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [playerId]: { playerId, x, y, lastSeen: Date.now() },
      }));
    });

    socket.on("connect", () => {
      if (roomId) {
        socket.emit("room:rejoin", { roomId });
      }
    });

    return () => {
      socket.off("room:state");
      socket.off("room:joined");
      socket.off("room:error");
      socket.off("canvas:added");
      socket.off("canvas:updated");
      socket.off("canvas:deleted");
      socket.off("chat:message");
      socket.off("vote:update");
      socket.off("vote:result");
      socket.off("cursor:update");
      socket.off("chat:typing");
      socket.off("connect");
    };
  }, [roomId]);

  const createRoom = useCallback((name: string) => {
    socketRef.current.emit("room:create", { name });
  }, []);

  const joinRoom = useCallback((rid: string, name: string) => {
    socketRef.current.emit("room:join", { roomId: rid, name });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current.emit("game:start");
  }, []);

  const addElement = useCallback((element: Omit<CanvasElement, "id" | "zIndex" | "ownerId">) => {
    socketRef.current.emit("canvas:add", element);
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    socketRef.current.emit("canvas:update", { elementId, updates });
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    socketRef.current.emit("canvas:delete", { elementId });
  }, []);

  const sendChat = useCallback((text: string) => {
    socketRef.current.emit("chat:send", { text });
  }, []);

  const castVote = useCallback((targetId: string) => {
    socketRef.current.emit("vote:cast", { targetId });
  }, []);

  const skipPhase = useCallback(() => {
    socketRef.current.emit("phase:skip");
  }, []);

  const voteDone = useCallback(() => {
    socketRef.current.emit("phase:done");
  }, []);

  const playAgain = useCallback(() => {
    socketRef.current.emit("game:playAgain");
  }, []);

  const emitCursorMove = useCallback((x: number, y: number) => {
    socketRef.current.emit("cursor:move", { x, y });
  }, []);

  const emitTyping = useCallback(() => {
    socketRef.current.emit("chat:typing");
  }, []);

  const myPlayer = room?.players.find((p) => p.id === myPlayerId);
  const amIHost = myPlayer?.isHost ?? false;

  return {
    room,
    roomId,
    myPlayerId,
    error,
    voteTally,
    remoteCursors,
    voteResult,
    typingPlayers,
    myPlayer,
    amIHost,
    socket: socketRef.current,
    createRoom,
    joinRoom,
    startGame,
    addElement,
    updateElement,
    deleteElement,
    sendChat,
    castVote,
    skipPhase,
    voteDone,
    playAgain,
    emitCursorMove,
    emitTyping,
  };
}
