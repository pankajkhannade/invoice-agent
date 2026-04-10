import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const count = await prisma.invoice.count({ where: { userId } });

  return NextResponse.json({
    count,
    isFirstInvoice: count === 1,
    isFreePlan: user?.plan === "free",
  });
}
