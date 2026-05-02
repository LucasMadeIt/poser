import { useState, useRef, useCallback, useEffect } from "react";
import type { Socket } from "socket.io-client";

export type VoiceChatState = {
  isRecording: boolean;
  speakingPlayers: Set<string>;
  startRecording: () => void;
  stopRecording: () => void;
  permissionDenied: boolean;
};

export function useVoiceChat(socket: Socket, roomId: string): VoiceChatState {
  const [isRecording,     setIsRecording]     = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState<Set<string>>(new Set());

  const recorderRef   = useRef<MediaRecorder | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const chunkBufsRef  = useRef<Blob[]>([]);

  // receive and play audio from other players
  useEffect(() => {
    function onChunk({ playerId, chunk }: { playerId: string; chunk: ArrayBuffer }) {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const buf = chunk instanceof ArrayBuffer ? chunk : (chunk as unknown as { buffer: ArrayBuffer }).buffer;
        ctx.decodeAudioData(buf.slice(0), (decoded) => {
          const src = ctx.createBufferSource();
          src.buffer = decoded;
          src.connect(ctx.destination);
          src.start();
          setSpeakingPlayers((prev) => {
            const next = new Set(prev);
            next.add(playerId);
            return next;
          });
          src.onended = () => {
            setSpeakingPlayers((prev) => {
              const next = new Set(prev);
              next.delete(playerId);
              return next;
            });
          };
        });
      } catch {
        // ignore decode errors
      }
    }

    function onSpeaking({ playerId, active }: { playerId: string; active: boolean }) {
      setSpeakingPlayers((prev) => {
        const next = new Set(prev);
        if (active) next.add(playerId); else next.delete(playerId);
        return next;
      });
    }

    socket.on("voice:chunk",   onChunk);
    socket.on("voice:speaking", onSpeaking);
    return () => {
      socket.off("voice:chunk",   onChunk);
      socket.off("voice:speaking", onSpeaking);
    };
  }, [socket]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunkBufsRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunkBufsRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (chunkBufsRef.current.length === 0) return;
        const blob = new Blob(chunkBufsRef.current, { type: mime });
        const arrayBuffer = await blob.arrayBuffer();
        socket.emit("voice:chunk", { chunk: arrayBuffer });
        socket.emit("voice:speaking", { active: false });
        chunkBufsRef.current = [];
      };

      recorder.start();
      setIsRecording(true);
      socket.emit("voice:speaking", { active: true });
    } catch {
      setPermissionDenied(true);
    }
  }, [isRecording, socket, roomId]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !recorderRef.current) return;
    recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, [isRecording]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { isRecording, speakingPlayers, startRecording, stopRecording, permissionDenied };
}
