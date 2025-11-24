import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "@/types/finance";
import { formatInr } from "@/lib/utils";

interface TransactionsTableProps {
  transactions: Transaction[];
}

const typeLabel: Record<string, string> = {
  debit: "Debit",
  credit: "Credit",
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const visibleTransactions = transactions.filter(
    (txn) => !(txn.tags?.includes("receipt-item"))
  );
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Latest transactions</h3>
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">
          Live synced
        </span>
      </div>
      <ScrollArea className="mt-4 h-80 pr-4">
        <table className="w-full text-sm text-white/80">
          <thead className="text-white/50">
            <tr>
              <th className="py-2 text-left font-medium">Amount</th>
              <th className="py-2 text-left font-medium">Category</th>
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-left font-medium">Date &amp; time</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((txn) => (
              <tr
                key={txn.id}
                className="border-b border-white/5 last:border-none hover:bg-white/5"
              >
                <td className="py-3 text-base font-semibold text-white">
                  {formatInr(txn.amount)}
                </td>
                <td className="py-3 text-white/70">{txn.category}</td>
                <td className="py-3">
                  <Badge
                    className={`flex items-center gap-1 border-0 ${
                      txn.type === "credit"
                        ? "bg-[#2CFF75]/10 text-[#2CFF75]"
                        : "bg-[#FF6F6F]/10 text-[#FF6F6F]"
                    }`}
                  >
                    {txn.type === "credit" ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {typeLabel[txn.type]}
                  </Badge>
                </td>
                <td className="py-3 text-white/60">
                  {new Date(txn.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

