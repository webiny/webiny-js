import { createAbstraction } from "@webiny/feature/api";
import type { ReviewTargetLinkParams } from "~/features/notifications/ReviewTargetLink/abstractions.js";

export interface IReviewTargetLinkService {
    /**
     * The admin URL that opens the revision in the review's own tenant, or `null` when there is
     * no adapter for the namespace, no admin host or no current tenant. Never rejects; a throw is
     * logged here once and answered with `null`.
     */
    getUrl(params: ReviewTargetLinkParams): Promise<string | null>;
}

/**
 * Builds the e-mail link of a notification (R195). Internal (D132): no permission check. Callers
 * never log a link problem.
 */
export const ReviewTargetLinkService =
    createAbstraction<IReviewTargetLinkService>("ReviewTargetLinkService");

export namespace ReviewTargetLinkService {
    export type Interface = IReviewTargetLinkService;
}
