import { AdvancedPublishingWorkflow } from "~/types";
import { apwEntryPlugins } from "./apwEntryPlugins";
import { linkContentReviewToEntry } from "./linkContentReviewToEntry";
import { linkWorkflowToEntry } from "./linkWorkflowToEntry";
import { triggerContentReview } from "./triggerContentReview";
import { updateContentReviewStatus } from "./updateContentReviewStatus";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryApwSettingsGetterPlugin } from "./CmsEntryApwSettingsGetterPlugin";
import { createCommentNotification } from "./notifications/commentNotification";
import { createContentUrlPlugin } from "~/plugins/cms/notifications/contentUrl";
import { createChangeRequestNotification } from "~/plugins/cms/notifications/changeRequestNotification";

interface ApwCmsHooksParams {
    apw: AdvancedPublishingWorkflow;
    cms: HeadlessCms;
    plugins: PluginsContainer;
    security: Security;
}
export const apwCmsHooks = (params: ApwCmsHooksParams) => {
    /**
     * We do not need to assign anything if no apw or cms in the context.
     * This might happen on options request.
     */
    if (!params.apw || !params.cms) {
        return;
    }

    params.plugins.register([
        new CmsEntryApwSettingsGetterPlugin(),
        createCommentNotification(),
        createChangeRequestNotification(),
        createContentUrlPlugin()
    ]);

    apwEntryPlugins(params);

    linkContentReviewToEntry(params);

    linkWorkflowToEntry(params);

    triggerContentReview(params);

    updateContentReviewStatus(params);
};
