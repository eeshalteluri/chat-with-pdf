import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { userSubscription } from "./db/schema";
import { eq } from "drizzle-orm";

const DAY_IN_MS = 100 * 60 * 60 *24;

export const checkSubscription = async () => {
    const {userId} = await auth();
    if(!userId) {
        return false;
    }

    const _userSubscriptions = await db
    .select()
    .from(userSubscription)
    .where(eq(userSubscription.userId, userId));

    if(!_userSubscriptions[0]){
        return false;
    }

    const _userSubscription = _userSubscriptions[0];

    const isValid = _userSubscription.stripePriceId && _userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

    console.log("Is Valid: ", isValid);

    return !!isValid;
}