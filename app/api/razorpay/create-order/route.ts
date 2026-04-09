import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 49900,  // ₹499 in paise
  annual: 399900,  // ₹3,999 in paise
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { plan } = await req.json();
    const amount = PLAN_AMOUNTS[plan];

    if (!amount) {
      return new NextResponse("Invalid plan", { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { userId, plan },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[RAZORPAY_CREATE_ORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
