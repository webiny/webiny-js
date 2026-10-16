import type { ReviewListTab } from "./abstractions.js";

export interface ReviewListTabDefinition {
    value: ReviewListTab;
    label: string;
}

// The four tabs in design order (README 8); the Failed steps tab belongs to 8b.
export const REVIEW_LIST_TABS: ReviewListTabDefinition[] = [
    { value: "assignedToMe", label: "Assigned to me" },
    { value: "pool", label: "Team pool" },
    { value: "teamInReview", label: "Team in review" },
    { value: "myRequests", label: "My requests" }
];
