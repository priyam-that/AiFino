"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/insights", label: "Insights" },
  { href: "/invest", label: "Invest" },
  { href: "/advice", label: "Advice" },
];

const legal = [
  { href: "#", label: "Privacy" },
  { href: "#", label: "Terms" },
  { href: "#", label: "Security" },
];

const social = [
  { href: "#", label: "Twitter", icon: Twitter },
  { href: "#", label: "GitHub", icon: Github },
  { href: "#", label: "LinkedIn", icon: Linkedin },
  { href: "#", label: "Email", icon: Mail },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-black via-[#050505] to-black">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <Link
              href="/"
              className="inline-block text-lg font-semibold uppercase tracking-[0.2em] text-white transition hover:text-[#2CFF75]"
            >
              Finospark
            </Link>
            <p className="text-sm text-white/60">
              AI-powered personal finance. Ignite clarity across every swipe, tap,
              and transfer.
            </p>
            <div className="flex gap-3">
              {social.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group rounded-full border border-white/10 bg-black/60 p-2 text-white/60 transition hover:border-[#2CFF75]/50 hover:text-[#2CFF75]"
                    aria-label={item.label}
                  >
                    <Icon className="size-4" />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Navigation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Navigation
            </h3>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition hover:text-[#2CFF75]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Legal
            </h3>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition hover:text-[#2CFF75]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact/CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Support
            </h3>
            <p className="text-sm text-white/60">
              Need help? Get in touch with our team.
            </p>
            <Link
              href="/advice"
              className="inline-flex items-center gap-2 rounded-full border border-[#2CFF75]/50 bg-black/60 px-4 py-2 text-sm font-medium text-[#2CFF75] transition hover:bg-[#2CFF75]/10"
            >
              Contact Support
            </Link>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 border-t border-white/10 pt-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Finospark. All rights reserved.
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Powered by Finospark Team
            </p>
          </div>
        </motion.div>
      </div>
      {/* Decorative glow effect */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.4 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 1 }}
        className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#2CFF75]/20 blur-[80px]"
      />
    </footer>
  );
}

