import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col justify-center gap-6 px-4 py-16 text-white">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Finospark</p>
        <h1 className="text-4xl font-semibold">Sign in to your workspace</h1>
        <p className="text-white/60">
          Use your username or email and password to access transactions, insights, and Spark AI.
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/50 p-8">
        <LoginForm />
      </div>
      <p className="text-center text-xs text-white/50">
        Need an invite?{" "}
        <Link href="/auth/register" className="text-[#2CFF75]">
          Create a new account
        </Link>
      </p>
    </div>
  );
}

