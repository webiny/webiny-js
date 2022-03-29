import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { AdvancedPublishingWorkflow } from "~/types";
import triggerContentReview from "./triggerContentReview";
import { linkContentReviewToPage } from "./linkContentReviewToPage";
import { updateContentReviewStatus } from "./updateContentReviewStatus";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface InitiateContentReviewParams {
    pageBuilder: PageBuilderContextObject;
    apw: AdvancedPublishingWorkflow;
    getIdentity: () => SecurityIdentity;
}

export const apwPageBuilderPlugins = (params: InitiateContentReviewParams) => [
    triggerContentReview(params),
    linkContentReviewToPage(params),
    updateContentReviewStatus(params)
];
