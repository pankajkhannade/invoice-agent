import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, plan } = session.metadata || {};
    if (userId && plan) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    // Sync plan name to user when subscription changes (e.g. trial→paid, plan change)
    const planName = sub.items.data[0]?.price?.nickname;
    if (planName) {
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: planName.toLowerCase() },
      });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    // Log the failure — user record already exists; a future enhancement
    // could send an in-app notification or email alert here.
    const subId = (invoice as unknown as { subscription?: string }).subscription;
    console.warn(
      `[Stripe Webhook] Payment failed for customer=${invoice.customer} ` +
      `subscription=${subId ?? "unknown"} amount_due=${invoice.amount_due}`
    );
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await prisma.user.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { plan: "free" },
    });
  }

  return NextResponse.json({ received: true });
}

export const dynamic = "force-dynamic";
