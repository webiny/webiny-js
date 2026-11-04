export const StepState = {
    Pending: "pending",
    Awaiting: "awaiting",
    InReview: "inReview",
    Approved: "approved",
    Rejected: "rejected",
    Failed: "failed"
} as const;

export type StepStateValue = (typeof StepState)[keyof typeof StepState];
