import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const ChatBubble = ({ role, content }: ChatBubbleProps) => {
  const displayContent = content.replace(/\[LEADS_JSON\][\s\S]*?\[\/LEADS_JSON\]/g, "").replace(/\[NICHE_SELECT\][\s\S]*?\[\/NICHE_SELECT\]/g, "").trim();

  return (
    <div
      className={cn(
        "w-full animate-[float-up_0.4s_ease-out_forwards]",
        role === "user" ? "flex justify-end md:justify-end" : "flex justify-start md:justify-start"
      )}
    >
      {role === "user" ? (
        <div className="max-w-[80%] px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/20 text-foreground text-sm">
          {content}
        </div>
      ) : (
        <div className="max-w-[85%] text-sm text-foreground">
          <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_p]:leading-relaxed">
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
