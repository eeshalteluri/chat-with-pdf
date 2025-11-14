import { addMonths, addYears, fromUnixTime } from 'date-fns';

// 📚 Define the type for clarity (optional, but good practice)
interface SubscriptionData {
  billing_cycle_anchor: number;
  plan: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
}

/**
 * Calculates the end date of the current billing period.
 * @param data The subscription data object.
 * @returns The current period end date as a Date object.
 */
export function calculatePeriodEnd(data: SubscriptionData): Date {
    // 1. Convert the Unix timestamp (seconds) to a JavaScript Date object
    // fromUnixTime expects seconds.
    const anchorDate = fromUnixTime(data.billing_cycle_anchor);

    // 2. Determine the correct function to use based on the interval
    const count = data.plan.interval_count;

    let periodEndDate: Date;

    switch (data.plan.interval) {
        case 'month':
            // Add N months to the anchor date
            periodEndDate = addMonths(anchorDate, count);
            break;
        case 'year':
            // Add N years to the anchor date
            periodEndDate = addYears(anchorDate, count);
            break;
        // For 'day' or 'week' you would use addDays/addWeeks
        default:
            // Handle other intervals or throw an error
            throw new Error(`Unsupported interval type: ${data.plan.interval}`);
    }

    // Note: The period ends *just before* this calculated date, 
    // but this date correctly marks the start of the *next* period.
    return periodEndDate;
}

// You can now use 'currentPeriodEnd' to replace the property that was missing:
// updateDatabase(subscriptionId, currentPeriodEnd);