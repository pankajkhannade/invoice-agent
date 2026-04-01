import Stripe from "stripe";

export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export const PLANS = {
  starter: {
    name: "Starter",
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    features: ["Up to 20 active invoices", "3-step follow-up sequences", "Email reminders"],
  },
  growth: {
    name: "Growth",
    price: 59,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || "",
    features: [
      "Unlimited invoices",
      "Custom escalation rules",
      "Multi-client management",
      "Analytics dashboard",
    ],
  },
};
