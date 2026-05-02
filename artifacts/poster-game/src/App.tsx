import { useEffect, useRef, useState } from "react";
import { useGame } from "./hooks/useGame";
import { LandingPage } from "./pages/LandingPage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { ChatPage } from "./pages/ChatPage";
import { ResultsPage } from "./pages/ResultsPage";
import { RoleReveal } from "./components/RoleReveal";

export default function App() {
  const {
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
    socket,
    createRoom,
    joinRoom,
    startGame,
    addElement,
    updateElement,
    deleteElement,
    sendChat,
    castVote,
    skipPhase,
    playAgain,
    emitCursorMove,
    emitTyping,
  } = useGame();

  const [showReveal, setShowReveal] = useState(false);
  const prevPhase = useRef<string | null>(null);

  useEffect(() => {
    if (!room) return;
    const prev = prevPhase.current;
    const curr = room.phase;
    if (curr === "design" && prev !== "design" && prev !== null) {
      setShowReveal(true);
    }
    prevPhase.current = curr;
  }, [room?.phase]);

  const myRole = myPlayer?.isImposter ? "imposter" : "crewmate";

  if (!room || !roomId) {
    return (
      <LandingPage
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
      />
    );
  }

  if (room.phase === "lobby") {
    return (
      <LobbyPage
        room={room}
        mySocketId={socket.id ?? ""}
        myPlayerId={myPlayerId}
        amIHost={amIHost}
        onStart={startGame}
      />
    );
  }

  if (room.phase === "design") {
    return (
      <>
        {showReveal && (
          <RoleReveal role={myRole} onDismiss={() => setShowReveal(false)} myPlayerId={myPlayerId} myPlayerColor={room.players.find(p=>p.id===myPlayerId)?.color} />
        )}
        <GamePage
          room={room}
          myPlayerId={myPlayerId}
          amIHost={amIHost}
          onAdd={addElement}
          onUpdate={updateElement}
          onDelete={deleteElement}
          onSkip={skipPhase}
          remoteCursors={remoteCursors}
          emitCursorMove={emitCursorMove}
          socket={socket}
          roomId={roomId}
        />
      </>
    );
  }

  if (room.phase === "chat" || room.phase === "vote") {
    return (
      <ChatPage
        room={room}
        myPlayerId={myPlayerId}
        amIHost={amIHost}
        onSend={sendChat}
        onSkip={skipPhase}
        voteTally={voteTally}
        onVote={castVote}
        voteResult={voteResult}
        typingPlayers={typingPlayers}
        emitTyping={emitTyping}
        socket={socket}
        roomId={roomId}
      />
    );
  }

  if (room.phase === "results" || room.phase === "ended") {
    return (
      <ResultsPage
        room={room}
        myPlayerId={myPlayerId}
        amIHost={amIHost}
        onPlayAgain={playAgain}
      />
    );
  }

  return null;
}
