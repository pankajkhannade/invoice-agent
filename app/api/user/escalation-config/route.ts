import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;

  const config = await prisma.escalationConfig.findUnique({ where: { userId } });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.plan !== "growth") {
    return NextResponse.json({ error: "Growth plan required" }, { status: 403 });
  }

  const body = await req.json();
  const {
    firstFollowUpDays = 7,
    secondFollowUpDays = 14,
    thirdFollowUpDays = 21,
    firstFollowUpTone = "friendly",
    secondFollowUpTone = "firm",
    thirdFollowUpTone = "final",
    autoEscalateAfterDays = 14,
  } = body;

  const config = await prisma.escalationConfig.upsert({
    where: { userId },
    update: {
      firstFollowUpDays: Number(firstFollowUpDays),
      secondFollowUpDays: Number(secondFollowUpDays),
      thirdFollowUpDays: Number(thirdFollowUpDays),
      firstFollowUpTone,
      secondFollowUpTone,
      thirdFollowUpTone,
      autoEscalateAfterDays: Number(autoEscalateAfterDays),
    },
    create: {
      userId,
      firstFollowUpDays: Number(firstFollowUpDays),
      secondFollowUpDays: Number(secondFollowUpDays),
      thirdFollowUpDays: Number(thirdFollowUpDays),
      firstFollowUpTone,
      secondFollowUpTone,
      thirdFollowUpTone,
      autoEscalateAfterDays: Number(autoEscalateAfterDays),
    },
  });

  return NextResponse.json(config);
}
