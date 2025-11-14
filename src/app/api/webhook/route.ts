// src/app/api/webhook/route.ts

import { calculatePeriodEnd } from "@/lib/calculatePeriodEnd";
import { db } from "@/lib/db";
import { userSubscription } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// ... (imports and initial webhook setup) ...

export async function POST (req: Request) {
    const body = await req.text();
    const signature = req.headers.get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try{
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SIGNING_SECRET as string);
    }catch(error) {
        return new NextResponse('Webhook error: ', {status: 400});
    }

    try{
        // --- NEW SUBSCRIPTION CREATED ---
        // --- NEW SUBSCRIPTION CREATED (FIXED) ---
        if(event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            // The subscription property on the session is *always* the ID (string) or null.
            if(!session.subscription) { 
                return new NextResponse("Subscription ID missing on session", {status: 400})
            }
            
            // You are correctly fetching the subscription object.
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            ) as Stripe.Subscription; 

            if(!session?.metadata?.userId) {
                return new NextResponse("User ID not found",{status: 400})
            }

            // The issue is likely here: subscription.customer is a string (ID), 
            // and subscription.items.data[0].price.id is the Price ID.
            // The code seems syntactically correct based on typical Stripe object structure,
            // so the failure is likely the timing issue noted above.
            await db.insert(userSubscription).values({
                userId: session.metadata.userId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string, // Cast required if customer is not confirmed as string
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(1000),
            })
            console.log("Created subscription");
        }

        // --- SUBSCRIPTION RENEWED/UPDATED ---
        // --- SUBSCRIPTION RENEWED/UPDATED (FIXED) ---
        if (event.type === "invoice.payment_succeeded") {
            const invoice = event.data.object as Stripe.Invoice;

            // The correct path is directly 'invoice.subscription'
            if (!invoice.parent?.subscription_details?.subscription) { 
                return new NextResponse("Invoice not tied to subscription", { status: 400 });
            }

            // The subscription property is the string ID at this point
            const subscription = await stripe.subscriptions.retrieve(
                invoice.parent?.subscription_details?.subscription as string // Use invoice.subscription directly
            );

            console.log("Subscription data:", subscription);
            const price = subscription.items.data[0].price;

            // Stripe's Price object contains recurring info under `recurring`
            const subscriptionData = {
                billing_cycle_anchor: subscription.billing_cycle_anchor,
                plan: {
                    interval: (price.recurring?.interval ?? 'month') as 'day' | 'week' | 'month' | 'year',
                    interval_count: price.recurring?.interval_count ?? 1,
                }
            }

            const currentPeriodEnd = calculatePeriodEnd(subscriptionData)

            if (!subscription|| !subscription.items.data[0]?.price?.id) {
                return new NextResponse("Subscription details missing for update", { status: 400 });
            }

            await db.update(userSubscription).set({
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(currentPeriodEnd)
            }).where(eq(userSubscription.stripeSubscriptionId, subscription.id)); 

            console.log("Updated subscription");
        }

        // ... (Handle other event types, like 'customer.subscription.deleted') ...

        return new NextResponse(null, {status: 200});
    }catch(error){
        console.log("Web hook error:", error);
        return new NextResponse('Webhook error: ', {status: 400});
    }
}