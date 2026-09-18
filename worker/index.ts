import Redis from "ioredis";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const redis = new Redis(process.env.REDIS_URL);
const prisma = new PrismaClient();
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
});

async function ensureGroup() {
  try {
    await redis.xgroup("CREATE", "orders.placed", "notifications", "0", "MKSTREAM");
  } catch (e: any) {
    if (!String(e.message).includes("BUSYGROUP")) throw e;
  }
}

async function loop() {
  await ensureGroup();
  while (true) {
    const res = await redis.xreadgroup(
      "GROUP", "notifications", "mailer",
      "COUNT", 1, "BLOCK", 5000, "STREAMS", "orders.placed", ">",
    );
    if (!res) continue;
    for (const [, entries] of res as any) {
      for (const [id, fields] of entries) {
        const map: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) map[fields[i]] = fields[i + 1];
        const order = await prisma.order.findUnique({
          where: { id: map.orderId },
          include: { items: true },
        });
        if (order && map.email) {
          const lines = order.items
            .map((i) => `${i.nameSnapshot} × ${i.qty}`)
            .join("\n");
          await transport.sendMail({
            from: "receipts@appstore.local",
            to: map.email,
            subject: `AppStore receipt ${order.id}`,
            text: `${lines}\nTotal paise: ${order.totalPaise}`,
          });
        }
        await redis.xack("orders.placed", "notifications", id);
      }
    }
  }
}

loop().catch((err) => {
  console.error(err);
  process.exit(1);
});
