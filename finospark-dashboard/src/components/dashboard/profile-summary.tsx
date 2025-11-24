import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { formatInr } from "@/lib/utils";
import { UserProfile } from "@/types/finance";

interface ProfileSummaryProps {
  profile: UserProfile;
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  const completion = Math.min(
    100,
    Math.round((profile.balance / (profile.savingsGoal || 1)) * 100)
  );

  return (
    <aside
      id="profile"
      className="rounded-3xl border border-white/10 bg-black/50 p-6 text-white"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-12 border border-[#2CFF75]/40 bg-white/10">
          <AvatarFallback>
            {profile.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Spark user
          </p>
          <p className="text-lg font-semibold">{profile.name}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Balance
          </p>
          <p className="text-3xl font-semibold text-[#2CFF75]">
            {formatInr(profile.balance)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Savings goal
          </p>
          <p className="text-base text-white/80">
            {formatInr(profile.savingsGoal)}
          </p>
        </div>
        <Progress
          value={completion}
          className="h-2 bg-white/10 [&>[data-slot=indicator]]:bg-[#2CFF75]"
        />
        <p className="text-xs text-white/60">
          {completion}% to goal · keep the neon streak!
        </p>
      </div>

      <div id="rewards" className="mt-8 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
          Rewards
        </p>
        {profile.rewards.slice(0, 3).map((reward) => (
          <div
            key={reward.id}
            className="rounded-2xl border border-[#2CFF75]/10 bg-white/5 p-4"
          >
            <p className="text-sm text-white/60">
              {new Date(reward.createdAt).toLocaleDateString()}
            </p>
            <p className="text-base font-medium text-white">
              +{reward.points} pts
            </p>
            <p className="text-sm text-white/70">{reward.description}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

