import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { AdvancedPublishingWorkflow } from "~/types";
import triggerContentReview from "./triggerContentReview";
import { linkContentReviewToPage } from "./linkContentReviewToPage";

export interface InitiateContentReviewParams {
    pageBuilder: PageBuilderContextObject;
    apw: AdvancedPublishingWorkflow;
}

export const apwPageBuilderPlugins = (params: InitiateContentReviewParams) => [
    triggerContentReview(params),
    linkContentReviewToPage(params)
];
