export const ReviewState = {
    InProgress: "inProgress",
    Approved: "approved",
    Rejected: "rejected",
    Cancelled: "cancelled"
} as const;

export type ReviewStateValue = (typeof ReviewState)[keyof typeof ReviewState];
