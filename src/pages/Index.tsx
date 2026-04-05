import { useRef, useEffect, useCallback } from "react";
import StarOrb from "@/components/StarOrb";
import ChatBubble from "@/components/ChatBubble";
import { useSimulatedAI } from "@/hooks/useSimulatedAI";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const Index = () => {
  const { messages, state, setState, sendMessage } = useSimulatedAI();
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOrbClick = useCallback(() => {
    if (state === "speaking") return;

    if (state === "listening") {
      recognitionRef.current?.stop();
      setState("idle");
      return;
    }

    if (!SpeechRecognition) {
      const text = prompt("Digite sua pergunta:");
      if (text) sendMessage(text);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };

    recognition.onerror = () => setState("idle");
    recognition.onend = () => {
      setState((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("listening");
  }, [state, sendMessage, setState]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Chat messages above orb */}
      <div
        ref={chatRef}
        className="absolute top-4 left-4 right-4 bottom-[55%] overflow-y-auto flex flex-col gap-3 px-2 z-10"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
      </div>

      {/* Centered orb */}
      <StarOrb state={state} onClick={handleOrbClick} />

      {/* Title */}
      <h1 className="absolute bottom-6 text-muted-foreground text-xs tracking-widest uppercase z-10">
        Orion AI
      </h1>
    </div>
  );
};

export default Index;
