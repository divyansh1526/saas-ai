"use client";

import { useState } from "react";
import { Sparkles, Check, Zap, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProModal } from "@/hooks/use-pro-modal";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const PLANS = [
  {
    id: "monthly",
    name: "Monthly Pro",
    price: 499,
    priceDisplay: "₹499",
    period: "/ month",
    description: "Perfect for getting started",
    badge: null,
    features: [
      "Unlimited AI conversations",
      "All companion personalities",
      "Priority response speed",
      "Create unlimited companions",
      "Vector memory for each companion",
    ],
  },
  {
    id: "annual",
    name: "Annual Pro",
    price: 3999,
    priceDisplay: "₹3,999",
    period: "/ year",
    description: "Best value — save ₹1,989",
    badge: "SAVE 33%",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Early access to new features",
      "Priority support",
    ],
  },
] as const;

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ProModal() {
  const { isOpen, onClose } = useProModal();
  const [loading, setLoading] = useState<string | null>(null); // plan id being processed

  const handleSubscribe = async (plan: (typeof PLANS)[number]) => {
    setLoading(plan.id);
    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      // 2. Create Razorpay order via our API
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });

      if (!res.ok) {
        const err = await res.text();
        toast.error(err || "Failed to initiate payment.");
        return;
      }

      const { orderId, amount, currency } = await res.json();

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        order_id: orderId,
        amount,
        currency,
        name: "companion.ai",
        description: `${plan.name} Subscription`,
        theme: { color: "#0ea5e9" },
        handler: async (response: RazorpayPaymentResponse) => {
          // 4. Verify payment on our server
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, plan: plan.id }),
          });

          if (verifyRes.ok) {
            toast.success("🎉 You're now a Pro member! Enjoy unlimited access.");
            onClose();
            // Refresh to update subscription state throughout the app
            window.location.reload();
          } else {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
      });

      rzp.open();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      // Don't reset loading here — keep spinner until Razorpay modal opens
      // It resets on dismiss (ondismiss) or after reload on success
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-sky-500 via-blue-500 to-cyan-400 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
              <Crown className="h-6 w-6 fill-yellow-300 text-yellow-300" />
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription className="text-sky-100 text-sm mt-1">
              Unlock unlimited AI conversations and all premium features.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border-2 p-5 flex flex-col gap-4 transition-all",
                plan.id === "annual"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                  : "border-primary/10 bg-secondary"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                  {plan.badge}
                </span>
              )}

              {/* Plan name & price */}
              <div>
                <p className="font-semibold text-sm text-muted-foreground">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-3xl font-bold">{plan.priceDisplay}</span>
                  <span className="text-muted-foreground text-sm mb-1">
                    {plan.period}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-1.5 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loading !== null}
                variant={plan.id === "annual" ? "premium" : "default"}
                className="w-full cursor-pointer"
              >
                {loading === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Get {plan.name}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Secure payment via Razorpay · Demo mode · No real charges
        </p>
      </DialogContent>
    </Dialog>
  );
}
