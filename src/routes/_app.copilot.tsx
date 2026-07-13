import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles, Send, Paperclip, Copy, Share2, Download, RefreshCw, Trash2,
  Pin, Search, Plus, FileText, ExternalLink, ThumbsUp, ThumbsDown,
  Wrench, ShieldCheck, FileSearch, TrendingUp, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const suggestedPrompts = [
  { title: "Diagnose P-101 high vibration alarms", desc: "Correlate vibration logs with seal failure patterns and RUL.", icon: "Wrench" },
  { title: "Review ISO 55001 audit compliance gap", desc: "Identify missing asset management documentation and corrective items.", icon: "ShieldCheck" },
  { title: "Extract HAZOP safeguards for Unit 4", desc: "List relief valve trip setpoints and interlock test schedules.", icon: "FileSearch" },
  { title: "Forecast heat exchanger fouling trends", desc: "Analyze historical clean-in-place cycles across HX-88 and HX-92.", icon: "TrendingUp" },
];

const promptIcons: Record<string, any> = { Wrench, ShieldCheck, FileSearch, TrendingUp };

export const Route = createFileRoute("/_app/copilot")({
  head: () => ({ meta: [{ title: "AI Copilot — IndustrialMind AI" }] }),
  component: Copilot,
});

type Citation = {
  id: string;
  name: string;
  contentSnippet: string;
  similarity: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  created_at: string;
};

function Copilot() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingUserMessage, setStreamingUserMessage] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<Citation[] | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { userId } = useAuth();

  const { data: conversations = [] } = useQuery({
    queryKey: ["copilot_conversations"],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("copilot_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["copilot_messages", activeChatId],
    queryFn: async () => {
      if (!activeChatId) return [];
      const { data, error } = await supabase
        .from("copilot_messages")
        .select("*")
        .eq("conversation_id", activeChatId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!activeChatId
  });

  const activeChat = conversations.find(c => c.id === activeChatId);
  const started = activeChatId !== null;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  const sendMessage = async (text: string, existingChatId?: string) => {
    const userPrompt = text.trim();
    if (!userPrompt || !userId || isStreaming) return;

    let chatId = existingChatId || activeChatId;
    setStreamingUserMessage(userPrompt);
    setInput("");

    // Create a new conversation if none exists
    if (!chatId) {
      const { data, error } = await supabase
        .from("copilot_conversations")
        .insert({
          user_id: userId,
          title: userPrompt.substring(0, 40) + (userPrompt.length > 40 ? "..." : ""),
        })
        .select()
        .single();
      
      if (error || !data) {
        toast.error("Failed to start conversation");
        return;
      }
      chatId = data.id;
      setActiveChatId(chatId);
      queryClient.invalidateQueries({ queryKey: ["copilot_conversations"] });
    }

    setIsStreaming(true);
    setStreamingMessage("");
    setStreamingCitations(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userPrompt,
          conversationId: chatId,
          userId: userId
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || response.statusText);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      let accumulatedResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === "citations") {
                  setStreamingCitations(parsed.data);
                } else if (parsed.type === "text") {
                  accumulatedResponse += parsed.data;
                  setStreamingMessage(accumulatedResponse);
                } else if (parsed.type === "error") {
                  toast.error(parsed.data);
                }
              } catch (e) {
                // Ignore parse errors from chunk fragmentation
              }
            }
          }
        }
      }
    } catch (err: any) {
      toast.error("Error communicating with AI Copilot: " + err.message);
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["copilot_messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["copilot_messages", activeChatId] });
      queryClient.invalidateQueries({ queryKey: ["copilot_conversations"] });
      setStreamingMessage("");
      setStreamingUserMessage("");
      setStreamingCitations(null);
    }
  };

  const deleteChat = async (id: string) => {
    await supabase.from("copilot_conversations").delete().eq("id", id);
    if (activeChatId === id) setActiveChatId(null);
    queryClient.invalidateQueries({ queryKey: ["copilot_conversations"] });
    toast.success("Conversation deleted");
  };

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
      {/* Conversation sidebar */}
      <aside className="hidden flex-col border-r border-border/60 bg-muted/20 md:flex">
        <div className="border-b border-border/60 p-3">
          <Button className="w-full justify-start gradient-primary text-white shadow-elegant" onClick={() => setActiveChatId(null)}>
            <Plus className="h-4 w-4" /> New chat
          </Button>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search chats" className="h-9 pl-9 text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-3 py-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pinned</p>
            {conversations.filter(c => c.pinned).map((c) => (
              <ChatItem key={c.id} c={c} active={activeChatId === c.id} onClick={() => setActiveChatId(c.id)} onDelete={() => deleteChat(c.id)} />
            ))}
            <p className="mb-2 mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
            {conversations.filter(c => !c.pinned).map((c) => (
              <ChatItem key={c.id} c={c} active={activeChatId === c.id} onClick={() => setActiveChatId(c.id)} onDelete={() => deleteChat(c.id)} />
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <section className="flex min-w-0 flex-col">
        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 gradient-mesh overflow-y-auto">
            <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl gradient-primary shadow-elegant animate-float">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-center text-3xl font-bold tracking-tight text-foreground">How can I help you?</h1>
            <p className="mt-2 max-w-xl text-center text-sm text-muted-foreground">Ask anything about your plant — from HAZOP interpretations to failure diagnostics. I'll cite every source.</p>

            <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
              {suggestedPrompts.map((p) => {
                const Icon = promptIcons[p.icon] ?? Sparkles;
                return (
                  <button key={p.title} onClick={() => sendMessage(p.title)} className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:gradient-primary group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>

            <div className="mt-8 w-full max-w-3xl">
              <ChatComposer value={input} onChange={setInput} onSend={() => sendMessage(input)} disabled={isStreaming} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border/60 bg-background/60 px-6 py-3 backdrop-blur z-10">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{activeChat?.title || "Conversation"}</p>
                <p className="text-[11px] text-muted-foreground">{messages.length} messages</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon"><Pin className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteChat(activeChatId)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="mx-auto max-w-3xl px-6 py-8">
                {isLoadingMessages && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                
                {messages.map((msg) => (
                  msg.role === "user" ? 
                    <UserBubble key={msg.id} text={msg.content} /> : 
                    <AssistantBubble key={msg.id} text={msg.content} citations={msg.citations} />
                ))}

                {isStreaming && (
                  <>
                    <UserBubble text={streamingUserMessage || input || "..."} />
                    <AssistantBubble text={streamingMessage} citations={streamingCitations} streaming />
                  </>
                )}
                
                <div ref={scrollRef} className="h-1" />
              </div>
            </ScrollArea>

            <div className="border-t border-border/60 bg-background/80 p-4 backdrop-blur">
              <div className="mx-auto max-w-3xl">
                <ChatComposer value={input} onChange={setInput} onSend={() => sendMessage(input)} disabled={isStreaming} />
                <p className="mt-2 text-center text-[10px] text-muted-foreground">IndustrialMind AI cites every source. Verify critical decisions against original documents.</p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ChatItem({ c, active, onClick, onDelete }: any) {
  return (
    <div className={`group mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted"}`}>
      <button onClick={onClick} className="flex-1 flex items-center gap-2 truncate">
        {c.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
        <span className="flex-1 truncate text-[13px]">{c.title}</span>
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ChatComposer({ value, onChange, onSend, disabled }: { value: string; onChange: (v: string) => void; onSend: () => void, disabled?: boolean }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`relative rounded-2xl border border-border/70 bg-card shadow-card focus-within:border-primary/60 focus-within:shadow-elegant ${disabled ? 'opacity-70' : ''}`}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder="Ask about assets, SOPs, incidents, drawings…"
        className="min-h-14 resize-none border-0 bg-transparent px-4 py-3 pr-24 text-sm shadow-none focus-visible:ring-0"
      />
      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}><Paperclip className="h-4 w-4" /></Button>
        <Button onClick={onSend} size="icon" className="h-8 w-8 gradient-primary text-white shadow-elegant" disabled={disabled || !value.trim()}>
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="mb-6 flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md gradient-primary px-4 py-2.5 text-sm text-white shadow-elegant whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

function AssistantBubble({ text, citations, streaming }: { text: string, citations?: Citation[] | null, streaming?: boolean }) {
  return (
    <div className="mb-6 flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-elegant">
        {streaming ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card p-5 text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50">
          {text ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            <div className="flex gap-1 h-5 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
            </div>
          )}

          {citations && citations.length > 0 && (
            <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-3 not-prose">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cited sources · {citations.length}</p>
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {citations.map((s, i) => (
                  <div key={`${s.id}-${i}`} className="flex items-center gap-2 text-xs hover:bg-muted/50 p-1.5 rounded-md transition-colors cursor-pointer border border-transparent hover:border-border/50">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate text-foreground block font-medium">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate block">Similarity: {(s.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {!streaming && (
          <div className="mt-2 flex items-center gap-1 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary"><Copy className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary"><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-success"><ThumbsUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"><ThumbsDown className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
