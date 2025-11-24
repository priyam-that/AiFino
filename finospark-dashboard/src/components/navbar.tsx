"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";

const items = [
  { href: "/", label: "Home" },
  { href: "/insights", label: "Insights" },
  { href: "/invest", label: "Invest" },
  { href: "/advice", label: "Advice" },
];

type SessionSummary = {
  name: string;
  email: string;
  username?: string;
  coins?: number;
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionSummary | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [coins, setCoins] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    
    // Fetch session and coins
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSessionUser(data.user);
          setCoins(data.coins || 0);
          
          // Auto check-in when user opens the app
          if (data.user) {
            fetch("/api/rewards/check-in", { method: "POST" })
              .then((res) => res.json())
              .then((result) => {
                if (!cancelled && result.success) {
                  setCoins(result.coins);
                } else if (!cancelled && result.coins !== undefined) {
                  setCoins(result.coins);
                }
              })
              .catch(() => {
                // Silently fail check-in if there's an error
              });
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessionUser(null);
          setCoins(0);
        }
      })
      .finally(() => {
        if (!cancelled) setSessionResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
    setCoins(0);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:flex-nowrap lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold uppercase tracking-[0.2em] text-white"
        >
          Finospark
        </Link>
        <ul className="hidden gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-sm text-white md:flex">
          {items.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <li key={item.href} className="relative">
                {active && (
                  <motion.span
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-full bg-[#2CFF75]/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Link
                  href={item.href}
                  className={`relative block rounded-full px-4 py-1 transition-colors ${
                    active
                      ? "text-[#2CFF75]"
                      : "text-white/70 hover:text-[#2CFF75]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3">
          <Link
            href="/advice"
            className="rounded-full border border-[#2CFF75]/50 bg-[#1A1A1A] px-4 py-1 text-sm font-medium text-[#2CFF75] hover:bg-[#2CFF75]/10"
          >
            Spark AI
          </Link>
          {sessionUser ? (
            <div className="flex items-center gap-2 text-xs text-white/80">
              <span className="hidden text-right sm:flex sm:flex-col">
                <span className="font-semibold text-white">
                  {sessionUser.name}
                </span>
                {/*<span className="text-white/60">{sessionUser.email}</span> */}
                <span className="mt-1 flex items-center gap-1 text-[#2CFF75]">
                  <Coins className="size-3" />
                  <span className="font-semibold">{coins.toLocaleString()}</span>
                  <span className="text-[10px] text-white/60">coins</span>
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white transition hover:border-[#2CFF75] hover:text-[#2CFF75]"
              >
                Logout
              </button>
            </div>
          ) : sessionResolved ? (
            <Link
              href="/auth/login"
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-[#2CFF75] hover:text-[#2CFF75]"
            >
              Login
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

