import { SecurityIdentity } from "@webiny/api-security/types";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { AdvancedPublishingWorkflow } from "~/types";
import { triggerContentReview } from "./triggerContentReview";
import { linkContentReviewToPage } from "./linkContentReviewToPage";
import { updateContentReviewStatus } from "./updateContentReviewStatus";
import { linkWorkflowToPage } from "./linkWorkflowToPage";

export interface ApwPageBuilderPluginsParams {
    pageBuilder: PageBuilderContextObject;
    apw: AdvancedPublishingWorkflow;
    getIdentity: () => SecurityIdentity;
}

export type ApwPageBuilderMethods = Pick<
    PageBuilderContextObject,
    | "getPage"
    | "updatePage"
    | "onBeforePageCreate"
    | "onBeforePageCreateFrom"
    | "onBeforePagePublish"
    | "onBeforePageUpdate"
    | "onBeforePageDelete"
    | "onAfterPagePublish"
    | "onAfterPageUnpublish"
>;

export const apwPageBuilderHooks = (params: ApwPageBuilderPluginsParams) => {
    const { pageBuilder, apw, getIdentity } = params;

    const pageMethods = {
        onBeforePageCreate: pageBuilder.onBeforePageCreate,
        onBeforePageCreateFrom: pageBuilder.onBeforePageCreateFrom,
        onBeforePageUpdate: pageBuilder.onBeforePageUpdate,
        getPage: pageBuilder.getPage,
        updatePage: pageBuilder.updatePage
    };

    triggerContentReview({
        apw,
        onBeforePagePublish: pageBuilder.onBeforePagePublish
    });
    linkContentReviewToPage({
        apw,
        getPage: pageBuilder.getPage,
        updatePage: pageBuilder.updatePage,
        onBeforePageDelete: pageBuilder.onBeforePageDelete
    });
    updateContentReviewStatus({
        apw,
        getIdentity,
        onAfterPagePublish: pageBuilder.onAfterPagePublish,
        onAfterPageUnpublish: pageBuilder.onAfterPageUnpublish
    });
    linkWorkflowToPage({
        apw,
        ...pageMethods
    });
};
