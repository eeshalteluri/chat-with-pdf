import { auth } from "@clerk/nextjs/server";
import HomePage from "@/components/HomePage";
import { checkSubscription } from "@/lib/subscription";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;

  const isPro = await checkSubscription()
  let firstChat;

  if(userId){
    firstChat = await db.select().from(chats).where(eq(chats.userId, userId));

    if(firstChat) firstChat = firstChat[0];
  }

  return <HomePage isAuth={isAuth} isPro={isPro} firstChat={firstChat ?? null} />;
}
