import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const ChatBubble = ({ role, content }: ChatBubbleProps) => (
  <div
    className={cn(
      "max-w-[85%] text-sm animate-[float-up_0.4s_ease-out_forwards]",
      role === "user"
        ? "self-end text-right text-muted-foreground/80 italic"
        : "self-start text-foreground"
    )}
  >
    {role === "assistant" ? (
      <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p]:leading-relaxed">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    ) : (
      <span>{content}</span>
    )}
  </div>
);

export default ChatBubble;
