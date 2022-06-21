import { Security } from "@webiny/api-security/types";
import { PageBuilderContextObject } from "@webiny/api-page-builder/graphql/types";
import { AdvancedPublishingWorkflow } from "~/types";
import { triggerContentReview } from "./triggerContentReview";
import { linkContentReviewToPage } from "./linkContentReviewToPage";
import { updateContentReviewStatus } from "./updateContentReviewStatus";
import { linkWorkflowToPage } from "./linkWorkflowToPage";
import { PluginsContainer } from "@webiny/plugins";
import { PageApwSettingsGetterPlugin } from "~/plugins/pageBuilder/PageApwSettingsGetterPlugin";

export interface ApwPageBuilderPluginsParams {
    pageBuilder: PageBuilderContextObject;
    apw: AdvancedPublishingWorkflow;
    security: Security;
    plugins: PluginsContainer;
}

export const apwPageBuilderHooks = (params: ApwPageBuilderPluginsParams) => {
    const { pageBuilder, apw, security, plugins } = params;

    plugins.register(new PageApwSettingsGetterPlugin());

    triggerContentReview({
        apw,
        pageBuilder
    });
    linkContentReviewToPage({
        apw,
        pageBuilder
    });
    updateContentReviewStatus({
        apw,
        pageBuilder,
        security
    });
    linkWorkflowToPage({
        apw,
        pageBuilder
    });
};
