import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type DbMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data);
    setLoadingConvos(false);
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for current conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data.map(m => ({ ...m, role: m.role as "user" | "assistant" })));
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId, loadMessages]);

  const createConversation = useCallback(async (title?: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: title || "Nova conversa" })
      .select()
      .single();
    if (error || !data) return null;
    setConversations((prev) => [data, ...prev]);
    setCurrentConversationId(data.id);
    setMessages([]);
    return data.id;
  }, [userId]);

  const addMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    const { data } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();
    if (data) {
      const typed: DbMessage = { ...data, role: data.role as "user" | "assistant" };
      setMessages((prev) => [...prev, typed]);
    }
    // Update conversation title from first user message
    if (role === "user") {
      const convo = conversations.find(c => c.id === conversationId);
      if (convo?.title === "Nova conversa") {
        const title = content.slice(0, 60);
        await supabase.from("conversations").update({ title }).eq("id", conversationId);
        setConversations((prev) =>
          prev.map((c) => c.id === conversationId ? { ...c, title } : c)
        );
      }
      // Touch updated_at
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }
    return data;
  }, [conversations]);

  const updateLastAssistantMessage = useCallback(async (conversationId: string, content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
      }
      return [...prev, { id: "temp", conversation_id: conversationId, role: "assistant" as const, content, created_at: new Date().toISOString() }];
    });
  }, []);

  const finalizeAssistantMessage = useCallback(async (conversationId: string, content: string) => {
    // Remove temp message and insert real one
    setMessages((prev) => prev.filter(m => m.id !== "temp"));
    const { data } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, role: "assistant", content })
      .select()
      .single();
    if (data) {
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== "temp");
        return [...filtered, data];
      });
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [currentConversationId]);

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    messages,
    setMessages,
    loadingConvos,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    finalizeAssistantMessage,
    deleteConversation,
  };
}
