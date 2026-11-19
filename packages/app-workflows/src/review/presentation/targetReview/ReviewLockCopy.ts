// The lock texts an app can word for itself; the bar shows them beside the review message.
export interface ReviewLockCopy {
    // While a review is running.
    inReview: string;
    // After the review is approved.
    approved: string;
}
