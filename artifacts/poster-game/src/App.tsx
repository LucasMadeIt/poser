import { useEffect, useRef, useState } from "react";
import { useGame } from "./hooks/useGame";
import { LandingPage } from "./pages/LandingPage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { ChatPage } from "./pages/ChatPage";
import { VotePage } from "./pages/VotePage";
import { ResultsPage } from "./pages/ResultsPage";
import { RoleReveal } from "./components/RoleReveal";

export default function App() {
  const {
    room,
    roomId,
    myPlayerId,
    error,
    voteTally,
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
          <RoleReveal role={myRole} onDismiss={() => setShowReveal(false)} />
        )}
        <GamePage
          room={room}
          myPlayerId={myPlayerId}
          amIHost={amIHost}
          onAdd={addElement}
          onUpdate={updateElement}
          onDelete={deleteElement}
          onSkip={skipPhase}
        />
      </>
    );
  }

  if (room.phase === "chat") {
    return (
      <ChatPage
        room={room}
        myPlayerId={myPlayerId}
        amIHost={amIHost}
        onSend={sendChat}
        onSkip={skipPhase}
      />
    );
  }

  if (room.phase === "vote") {
    return (
      <VotePage
        room={room}
        myPlayerId={myPlayerId}
        voteTally={voteTally}
        onVote={castVote}
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
