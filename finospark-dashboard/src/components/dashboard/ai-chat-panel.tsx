"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiResponse, Transaction, UserProfile } from "@/types/finance";

interface AIChatPanelProps {
  profile: UserProfile;
  transactions: Transaction[];
}

const quickPrompts = [
  "Explain my spending pattern",
  "Predict next month spending",
  "Give me a savings hack",
];

export function AIChatPanel({ profile, transactions }: AIChatPanelProps) {
  const [messages, setMessages] = useState<AiResponse[]>([
    {
      role: "assistant",
      content:
        "Hey Finospark friend ⚡️ I'm Spark — ask me anything about your money data.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const endpointByPrompt = useMemo(() => {
    return {
      "Explain my spending pattern": "/api/ai/spending-summary",
      "Predict next month spending": "/api/ai/predict",
    } as Record<string, string>;
  }, []);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: prompt, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setLoading(true);

    try {
      const endpoint = endpointByPrompt[prompt] ?? "/api/ai/advice";
      const payload: Record<string, unknown> = {
        question: prompt,
        profile,
      };

      if (endpoint === "/api/ai/spending-summary") {
        payload.profile = profile;
        payload.transactions = transactions.slice(0, 25);
      } else if (endpoint === "/api/ai/predict") {
        payload.transactions = transactions.slice(0, 25);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to reach Spark AI");
      }

      setMessages((prev) => [...prev, data]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${error instanceof Error ? error.message : "Spark glitch. Try again."}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="assistant"
      className="rounded-3xl border border-white/10 bg-gradient-to-b from-black/80 via-black to-[#030303] p-6 text-white"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Spark AI assistant
          </p>
          <h3 className="text-xl font-semibold">Insight co-pilot</h3>
        </div>
        <span className="rounded-full border border-[#2CFF75]/40 px-3 py-1 text-xs text-[#2CFF75]">
          Online
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:border-[#2CFF75] hover:text-[#2CFF75]"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex h-64 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.createdAt}-${index}`}
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "assistant"
                  ? "bg-[#2CFF75]/10 text-white"
                  : "bg-white/5 text-white/80"
              }`}
              dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, "<br />") }}
            />
          ))}
          {loading && (
            <p className="text-xs text-white/50">Spark is typing...</p>
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
          className="space-y-3"
        >
          <Textarea
            placeholder="Ask anything about your money..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-[96px] border-white/10 bg-black/30 text-white placeholder:text-white/40"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#2CFF75] text-black hover:bg-[#2CFF75]/90"
          >
            {loading ? "Thinking..." : "Send to Spark"}
          </Button>
        </form>
      </div>
    </section>
  );
}

