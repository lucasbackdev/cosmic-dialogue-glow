import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const ChatBubble = ({ role, content }: ChatBubbleProps) => (
  <div
    className={cn(
      "w-full animate-[float-up_0.4s_ease-out_forwards]",
      role === "user" ? "text-right" : "text-left"
    )}
  >
    <div
      className={cn(
        "inline-block max-w-[85%] text-sm",
        role === "user"
          ? "text-muted-foreground/80 italic"
          : "text-foreground"
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
  </div>
);

export default ChatBubble;
