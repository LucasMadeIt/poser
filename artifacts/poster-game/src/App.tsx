import { useEffect, useRef, useState } from "react";
import { useGame } from "./hooks/useGame";
import { LandingPage } from "./pages/LandingPage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { ChatPage } from "./pages/ChatPage";
import { ResultsPage } from "./pages/ResultsPage";
import { RoleReveal } from "./components/RoleReveal";
import { ImposterBriefing } from "./components/ImposterBriefing";
import { ChallengeOverlay } from "./components/ChallengeOverlay";

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
    imposterObjectives,
    pendingConstraint,
    createRoom,
    joinRoom,
    startGame,
    toggleChallengeMode,
    addElement,
    updateElement,
    deleteElement,
    sendChat,
    castVote,
    skipPhase,
    voteDone,
    playAgain,
    leaveRoom,
    emitCursorMove,
    emitTyping,
  } = useGame();

  const [showReveal, setShowReveal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showConstraint, setShowConstraint] = useState(false);
  const prevPhase = useRef<string | null>(null);

  useEffect(() => {
    if (!room) return;
    const prev = prevPhase.current;
    const curr = room.phase;
    if (curr === "design" && prev !== "design" && prev !== null) {
      setShowReveal(true);
      setShowBriefing(false);
      setShowConstraint(false);
    }
    prevPhase.current = curr;
  }, [room?.phase]);

  function handleRevealDismiss() {
    setShowReveal(false);
    // Show imposter briefing after role reveal, if applicable
    if (myRole === "imposter" && imposterObjectives) {
      setShowBriefing(true);
    }
    // Show constraint overlay if this player has a constraint
    if (pendingConstraint) {
      setShowConstraint(true);
    }
  }

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
        onToggleChallenge={toggleChallengeMode}
        onLeave={leaveRoom}
      />
    );
  }

  if (room.phase === "design") {
    return (
      <>
        {showReveal && (
          <RoleReveal
            role={myRole}
            onDismiss={handleRevealDismiss}
            myPlayerId={myPlayerId}
            myPlayerColor={room.players.find(p => p.id === myPlayerId)?.color}
          />
        )}
        {showBriefing && imposterObjectives && (
          <ImposterBriefing
            objectives={imposterObjectives}
            onDismiss={() => setShowBriefing(false)}
          />
        )}
        {showConstraint && pendingConstraint && (
          <ChallengeOverlay
            constraintType={pendingConstraint}
            onDismiss={() => setShowConstraint(false)}
          />
        )}
        <GamePage
          room={room}
          myPlayerId={myPlayerId}
          amIHost={amIHost}
          onAdd={addElement}
          onUpdate={updateElement}
          onDelete={deleteElement}
          onDone={voteDone}
          doneVotes={room.doneVotes ?? []}
          remoteCursors={remoteCursors}
          emitCursorMove={emitCursorMove}
          socket={socket}
          roomId={roomId}
          myConstraint={room.myConstraint}
          imposterObjectives={imposterObjectives}
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
