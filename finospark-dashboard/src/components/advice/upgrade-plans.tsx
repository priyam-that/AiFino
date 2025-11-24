"use client";

import { Check, Crown, Gift, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

type BillingCycle = "monthly" | "yearly";

const plans = [
	{
		id: "free",
		name: "Free",
		priceMonthly: 0,
		priceYearly: 0,
		description: "Get started",
		icon: Gift,
		features: [
			"Weekly insights",
			"Basic nudges",
			"1 AI chat / day",
			"Manual budgeting rules",
			"Email summaries",
		],
		cta: "Use free",
	},
	{
		id: "plus",
		name: "Plus",
		priceMonthly: 500,
		priceYearly: 500 * 12 * 0.83, // ~17% off yearly
		description: "Predict & automate more",
		icon: Crown,
		features: [
			"Priority predictions",
			"Advanced saving plans",
			"5 AI chats / day",
			"Auto-adjust budgets",
			"Early feature access",
			"Goal progress alerts",
		],
		cta: "Get Plus",
		highlighted: true,
	},
	{
		id: "max",
		name: "Max",
		priceMonthly: 2200,
		priceYearly: 2200 * 12 * 0.8,
		description: "Higher limits, priority",
		icon: Zap,
		features: [
			"Unlimited AI chats",
			"Deep spend anomaly scans",
			"Custom automation rules",
			"Priority support queue",
			"Team workspace (3 seats)",
			"Quarterly strategy review",
		],
		cta: "Get Max",
	},
];

export function UpgradePlans() {
	const [billing, setBilling] = useState<BillingCycle>("monthly");
	const [selected, setSelected] = useState("plus");

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Upgrade plans</h3>
				<div className="flex items-center gap-2 rounded-full bg-white/5 p-1 text-xs">
					<button
						type="button"
						onClick={() => setBilling("monthly")}
						className={`rounded-full px-3 py-1 ${
							billing === "monthly" ? "bg-[#2CFF75] text-black" : "text-white/60"
						}`}
					>
						Monthly
					</button>
					<button
						type="button"
						onClick={() => setBilling("yearly")}
						className={`rounded-full px-3 py-1 ${
							billing === "yearly" ? "bg-[#2CFF75] text-black" : "text-white/60"
						}`}
					>
						Yearly
						<span className="ml-1 hidden sm:inline text-[10px] text-black/70">
							{billing === "yearly" ? "Save 17%" : ""}
						</span>
					</button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				{plans.map((plan) => {
					const Icon = plan.icon;
					const price =
						billing === "monthly"
							? plan.priceMonthly
							: Math.round(plan.priceYearly);

					const isSelected = selected === plan.id;

					return (
						<Card
							key={plan.id}
							className={`relative flex h-full flex-col justify-between border ${
								plan.highlighted
									? "border-[#2CFF75]/40"
									: "border-white/10"
							} bg-black/40 transition-colors ${
								isSelected ? "ring-2 ring-[#2CFF75]" : ""
							}`}
						>
							<CardContent className="p-5">
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-white/5 p-2">
										<Icon className="h-6 w-6" />
									</div>
									<div>
										<p className="text-base font-semibold">{plan.name}</p>
										<p className="text-xs text-white/50">
											{plan.description}
										</p>
									</div>
								</div>

								<div className="mt-4">
									{price === 0 ? (
										<p className="text-3xl font-bold tracking-tight">₹0</p>
									) : (
										<p className="text-3xl font-bold tracking-tight">
											₹{price.toLocaleString()}
											<span className="ml-1 text-xs font-medium text-white/50">
												/{billing === "monthly" ? "mo" : "yr"}
											</span>
										</p>
									)}
									{plan.highlighted && billing === "yearly" && (
										<p className="mt-1 text-[10px] font-medium text-[#2CFF75]">
											Yearly billing applied
										</p>
									)}
								</div>

								<button
									type="button"
									onClick={() => setSelected(plan.id)}
									className={`mt-4 w-full rounded-md px-4 py-2 text-sm font-medium ${
										plan.highlighted
											? "bg-[#2CFF75] text-black"
											: "bg-white/10 text-white hover:bg-white/15"
									}`}
								>
									{plan.cta}
								</button>

								<ul className="mt-5 space-y-2 text-xs">
									{plan.features.map((f) => (
										<li key={f} className="flex items-start gap-2">
											<Check className="mt-[2px] h-3.5 w-3.5 text-[#2CFF75]" />
											<span className="text-white/70">{f}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<p className="text-[11px] text-white/50">
				Max includes higher limits and priority queue. Custom enterprise plans
				available on request.
			</p>
		</div>
	);
}