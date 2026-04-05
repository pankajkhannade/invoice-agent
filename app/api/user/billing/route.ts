import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const plan = user.plan || "free";
  const planInfo = PLANS[plan as keyof typeof PLANS];

  let stripeData: Record<string, any> = {};
  if (user.stripeCustomerId) {
    try {
      const stripe = getStripe();
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 1,
        status: "active",
      });
      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0] as any;
        stripeData = {
          subscriptionId: sub.id,
          status: sub.status,
          plan: planInfo?.name || plan,
          amount: sub.items.data[0]?.price.unit_amount
            ? sub.items.data[0].price.unit_amount / 100
            : 0,
          currency: sub.items.data[0]?.price.currency || "usd",
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        };
      }
    } catch (_err) {
      // Stripe not configured or error — return plan info only
    }
  }

  return NextResponse.json({
    plan,
    planName: planInfo?.name || "Free",
    stripeCustomerId: user.stripeCustomerId,
    ...stripeData,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const { return_url } = await req.json().catch(() => ({}));

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: return_url || `${process.env.NEXTAUTH_URL}/dashboard`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (_err) {
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
