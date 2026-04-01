# InvoiceAgent MVP

AI-powered invoice follow-up agent for freelancers and small agencies.

## Quick Start

```bash
cp .env.example .env
# Fill in .env values

npx prisma migrate dev --name init
npm run dev
```

## Deploy to Railway

1. Push to GitHub
2. Create Railway project → deploy from repo
3. Add PostgreSQL service (Railway will auto-set DATABASE_URL)
4. Set all env vars from `.env.example` in Railway dashboard
5. Set up Stripe webhook pointing to `https://your-app.railway.app/api/stripe/webhook`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Your public URL (e.g. https://yourapp.railway.app) |
| `NEXTAUTH_SECRET` | Random secret — run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe sk_live_... or sk_test_... |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID for $29/mo plan |
| `STRIPE_GROWTH_PRICE_ID` | Stripe Price ID for $59/mo plan |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `EMAIL_SERVER_HOST` | SMTP host |
| `EMAIL_SERVER_PORT` | SMTP port |
| `EMAIL_SERVER_USER` | SMTP username |
| `EMAIL_SERVER_PASSWORD` | SMTP password |
| `EMAIL_FROM` | From address for follow-up emails |

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** + PostgreSQL
- **NextAuth.js** (email/password + Google OAuth)
- **Stripe** (subscription billing)
- **Nodemailer** (follow-up email delivery)
- **Tailwind CSS**
- **Deploy:** Railway
