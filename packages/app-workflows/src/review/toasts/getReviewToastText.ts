import type { ReviewToastParams } from "./abstractions.js";

export interface ReviewToastText {
    title: string;
    description: string | null;
}

/*
 * The own-action toast texts (QBZ-93; Start per QBZ-82). Pure. The params are typed per kind, so
 * every text has what it needs.
 */
export const getReviewToastText = (params: ReviewToastParams): ReviewToastText => {
    switch (params.kind) {
        case "requested":
            return {
                title: "Review requested",
                description: `${params.stepTitle} is the first step.`
            };
        case "started":
            return {
                title: `Started “${params.stepTitle}”`,
                description: "It’s now in Assigned to me."
            };
        case "restarted":
            return {
                title: `Restarted “${params.stepTitle}”`,
                description: "The step is running again."
            };
        case "approved": {
            if (params.nextStepTitle) {
                return {
                    title: `Approved “${params.stepTitle}”`,
                    description: `Next: ${params.nextStepTitle}.`
                };
            }
            return {
                title: `Approved “${params.stepTitle}”`,
                description: "All steps approved. It’s ready to publish."
            };
        }
        case "rejected":
            return {
                title: `Rejected “${params.stepTitle}”`,
                description: "The requester is notified."
            };
        case "tookOver": {
            if (params.personName === null) {
                return { title: `Took over “${params.stepTitle}”`, description: null };
            }
            return {
                title: `Took over “${params.stepTitle}”`,
                description: `${params.personName} was notified.`
            };
        }
        case "reassigned":
            return {
                title: `Reassigned “${params.stepTitle}” to ${params.personName}`,
                description: "Both the previous and the new owner are notified."
            };
        case "cancelled":
            return { title: "Review cancelled", description: "Editing is unlocked." };
    }
};
