import { useState, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

const responses: Record<string, string> = {
  default:
    "Interessante! Sou uma IA simulada por enquanto, mas em breve vou poder te ajudar de verdade. Me pergunte qualquer coisa!",
};

function pickResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("nome") || lower.includes("quem é você"))
    return "Eu sou a Orion, sua assistente virtual estelar! ✨";
  if (lower.includes("hora") || lower.includes("horas"))
    return `Agora são ${new Date().toLocaleTimeString("pt-BR")}. ⏰`;
  if (lower.includes("dia") || lower.includes("data"))
    return `Hoje é ${new Date().toLocaleDateString("pt-BR")}. 📅`;
  if (lower.includes("olá") || lower.includes("oi") || lower.includes("hey"))
    return "Olá! Como posso te ajudar hoje? 🚀";
  if (lower.includes("tudo bem") || lower.includes("como vai"))
    return "Estou ótima, obrigada por perguntar! E você? 😊";
  if (lower.includes("obrigado") || lower.includes("valeu"))
    return "De nada! Estou aqui para ajudar! 💫";
  return responses.default;
}

export function useSimulatedAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<"idle" | "listening" | "speaking">("idle");

  const sendMessage = useCallback((text: string) => {
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setState("speaking");

    const reply = pickResponse(text);

    // Simulate thinking delay
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Use speech synthesis
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.lang = "pt-BR";
        utterance.rate = 1;
        utterance.onend = () => setState("idle");
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setState("idle"), 2000);
      }
    }, 800);
  }, []);

  return { messages, state, setState, sendMessage };
}
