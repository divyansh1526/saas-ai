import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles, Zap, MessageSquare, User, Crown } from "lucide-react";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";
import { MAX_AI_REQUESTS_FREE_COUNTS } from "@/constants";
import SettingsUpgradeButton from "@/components/settings-upgrade-button";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const isPro = await checkSubscription();

  const userSettings = await prismadb.userSettings.findUnique({
    where: { userId },
  });

  const userSubscription = await prismadb.userSubscription.findUnique({
    where: { userId },
    select: {
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });

  const requestsRemaining = userSettings?.aiRequestsCount ?? MAX_AI_REQUESTS_FREE_COUNTS;
  const requestsUsed = MAX_AI_REQUESTS_FREE_COUNTS - requestsRemaining;
  const usagePercent = Math.min(
    Math.round((requestsUsed / MAX_AI_REQUESTS_FREE_COUNTS) * 100),
    100,
  );

  return (
    <div className="h-full p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and subscription.
        </p>
      </div>

      {/* Account */}
      <div className="rounded-xl border border-primary/10 bg-secondary p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium mt-0.5">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium mt-0.5">
              {user?.emailAddresses?.[0]?.emailAddress ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Plan</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPro ? (
                <>
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">Pro</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Free</span>
                </>
              )}
            </div>
          </div>
          {isPro && userSubscription?.stripeCurrentPeriodEnd && (
            <div>
              <p className="text-muted-foreground">Renews</p>
              <p className="font-medium mt-0.5">
                {new Date(
                  userSubscription.stripeCurrentPeriodEnd,
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Usage */}
      <div className="rounded-xl border border-primary/10 bg-secondary p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">AI Usage</h2>
        </div>

        {isPro ? (
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">
              Unlimited AI requests with your Pro plan.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Free requests used</span>
              <span className="font-medium">
                {requestsUsed} / {MAX_AI_REQUESTS_FREE_COUNTS}
              </span>
            </div>
            <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {requestsRemaining > 0
                ? `${requestsRemaining} requests remaining on the free tier.`
                : "You have used all your free requests. Upgrade to Pro for unlimited access."}
            </p>
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      {!isPro && (
        <div className="rounded-xl border border-primary/10 bg-linear-to-br from-secondary to-primary/5 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-yellow-500/10">
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Get unlimited AI conversations, priority access, and more with the Pro
            plan.
          </p>
          <ul className="text-sm space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span> Unlimited AI requests
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span> Priority response speed
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span> Create unlimited companions
            </li>
          </ul>
          <SettingsUpgradeButton />
        </div>
      )}

      {/* AI Model Info */}
      <div className="rounded-xl border border-primary/10 bg-secondary p-6 space-y-3">
        <h2 className="text-lg font-semibold">AI Model</h2>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium">Google Gemini</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium font-mono text-xs bg-primary/10 px-2 py-0.5 rounded">
              gemini-2.5-flash
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Embeddings</span>
            <span className="font-medium font-mono text-xs bg-primary/10 px-2 py-0.5 rounded">
              gemini-embedding-001
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
