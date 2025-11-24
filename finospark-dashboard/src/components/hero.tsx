"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatInr } from "@/lib/utils";

interface HeroProps {
  daySpend: number;
  monthSpend: number;
}

export function Hero({ daySpend, monthSpend }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-[#050505] to-black px-4 py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm uppercase tracking-[0.3em] text-[#2CFF75]"
          >
            AI-powered personal finance
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-semibold leading-tight text-white md:text-5xl"
          >
            Ignite clarity across every swipe, tap, and transfer.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/70"
          >
            Finospark blends live insights, Gemini intelligence, and a neon black
            canvas to help you spend with intention and invest with confidence.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 rounded-full bg-[#2CFF75] px-6 py-3 text-black transition hover:translate-x-1"
            >
              Launch dashboard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/advice"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-white transition hover:border-[#2CFF75]"
            >
              Ask Spark AI
            </Link>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_120px_rgba(44,255,117,0.15)]"
        >
          <div className="grid gap-6">
            <div>
              <p className="text-sm text-white/60">Today&apos;s debit spend</p>
              <p className="text-4xl font-medium text-[#2CFF75]">
                {formatInr(daySpend)}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Last 4 weeks</p>
              <p className="text-2xl font-medium text-white">
                {formatInr(monthSpend)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Featured insight
              </p>
              <p className="mt-2 text-lg text-white">
                Dining is up 18% week over week. Spark suggests a neon-green cash
                envelope challenge to rebalance by Friday.
              </p>
            </div>
          </div>
          <motion.span
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="pointer-events-none absolute -right-10 top-10 h-32 w-32 rounded-full bg-[#2CFF75]/40 blur-[80px]"
          />
        </motion.div>
      </div>
    </section>
  );
}

