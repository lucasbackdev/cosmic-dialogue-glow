import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const ChatBubble = ({ role, content }: ChatBubbleProps) => (
  <div
    className={cn(
      "max-w-[80%] px-4 py-3 rounded-2xl text-sm animate-[float-up_0.4s_ease-out_forwards]",
      role === "user"
        ? "self-end bg-primary text-primary-foreground rounded-br-md"
        : "self-start bg-secondary text-secondary-foreground rounded-bl-md"
    )}
  >
    {content}
  </div>
);

export default ChatBubble;
