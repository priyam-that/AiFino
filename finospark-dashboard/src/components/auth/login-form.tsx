"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier || !password) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const text = await response.text();
      let data: Record<string, unknown> | null = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }
      if (!response.ok) {
        let errorMessage = "Unable to sign in.";
        if (typeof data === "object" && data && "error" in data) {
          const errorValue = (data as { error?: unknown }).error;
          if (typeof errorValue === "string" && errorValue.trim()) {
            errorMessage = errorValue;
          }
        }
        throw new Error(errorMessage);
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-white/70">
          Username or email
          <Input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
            placeholder="kaia@finospark.ai"
            disabled={submitting}
            required
          />
        </label>
      </div>
      <div>
        <label className="text-sm text-white/70">
          Password
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
            placeholder="••••••••"
            disabled={submitting}
            required
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#2CFF75] text-black hover:bg-[#2CFF75]/90"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-white/60">
        No account?{" "}
        <Link href="/auth/register" className="text-[#2CFF75]">
          Create one
        </Link>
      </p>
    </form>
  );
}

