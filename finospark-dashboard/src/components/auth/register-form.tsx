"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to register.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/70">
          Full name
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
            placeholder="Kaia Patel"
            disabled={submitting}
            required
          />
        </label>
        <label className="text-sm text-white/70">
          Username
          <Input
            value={form.username}
            onChange={(event) => updateField("username", event.target.value)}
            className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
            placeholder="kaiapatel"
            disabled={submitting}
            required
          />
        </label>
      </div>
      <label className="text-sm text-white/70">
        Email address
        <Input
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
          placeholder="kaia@finospark.ai"
          disabled={submitting}
          required
        />
      </label>
      <label className="text-sm text-white/70">
        Password
        <Input
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/40"
          placeholder="At least 8 characters"
          disabled={submitting}
          required
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#2CFF75] text-black hover:bg-[#2CFF75]/90"
      >
        {submitting ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[#2CFF75]">
          Sign in
        </Link>
      </p>
    </form>
  );
}

