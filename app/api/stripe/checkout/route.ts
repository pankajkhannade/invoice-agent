import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  const planConfig = PLANS[plan as keyof typeof PLANS];
  if (!planConfig) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email!,
      name: user.name || undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
    },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    metadata: { userId, plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
