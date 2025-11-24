import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center gap-6 px-4 py-16 text-white">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Welcome to Finospark
        </p>
        <h1 className="text-4xl font-semibold">Create your secure workspace</h1>
        <p className="text-white/60">
          Spin up a demo account backed by SQLite so Spark can store your transactions, history, and AI threads.
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/50 p-8">
        <RegisterForm />
      </div>
      <p className="text-center text-xs text-white/50">
        Already tracking money with Spark?{" "}
        <Link href="/auth/login" className="text-[#2CFF75]">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}

