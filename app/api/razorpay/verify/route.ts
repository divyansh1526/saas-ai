import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

const PLAN_DURATION_MS: Record<string, number> = {
  monthly: 30 * 24 * 60 * 60 * 1000,
  annual: 365 * 24 * 60 * 60 * 1000,
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !plan
    ) {
      return new NextResponse("Missing payment details", { status: 400 });
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return new NextResponse("Invalid payment signature", { status: 400 });
    }

    // Calculate subscription expiry
    const durationMs = PLAN_DURATION_MS[plan] ?? PLAN_DURATION_MS.monthly;
    const periodEnd = new Date(Date.now() + durationMs);

    // Upsert subscription record (reusing existing Stripe-named columns for demo)
    await prismadb.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: razorpay_payment_id,
        stripeCustomerId: razorpay_order_id,
        stripePriceId: `razorpay_${plan}`,
        stripeCurrentPeriodEnd: periodEnd,
      },
      update: {
        stripeSubscriptionId: razorpay_payment_id,
        stripeCustomerId: razorpay_order_id,
        stripePriceId: `razorpay_${plan}`,
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RAZORPAY_VERIFY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
