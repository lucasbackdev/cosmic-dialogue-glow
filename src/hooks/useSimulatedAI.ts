import { useState, useCallback, useRef } from "react";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useSimulatedAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<"idle" | "listening" | "speaking">("idle");
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setState("speaking");

    const allMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao conectar com a IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const currentContent = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: currentContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: currentContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const currentContent = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: currentContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: currentContent }];
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Speak using browser voice
      if (assistantSoFar && "speechSynthesis" in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(assistantSoFar);
        utterance.lang = "pt-BR";
        utterance.rate = 1.3;
        utterance.pitch = 1.1;
        utterance.volume = 1;

        // Try to pick the best Portuguese voice available
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang === "pt-BR" && v.name.toLowerCase().includes("google")) 
          || voices.find(v => v.lang === "pt-BR" && !v.localService)
          || voices.find(v => v.lang === "pt-BR");
        if (ptVoice) utterance.voice = ptVoice;

        utterance.onend = () => setState("idle");
        utterance.onerror = () => setState("idle");
        window.speechSynthesis.speak(utterance);
      } else {
        setState("idle");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("AI error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente. 😔" },
      ]);
      setState("idle");
    }
  }, [messages]);

  return { messages, state, setState, sendMessage };
}
