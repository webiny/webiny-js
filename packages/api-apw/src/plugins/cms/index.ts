import { AdvancedPublishingWorkflow } from "~/types";
import { apwEntryPlugins } from "~/plugins/cms/apwEntryPlugins";
import { linkContentReviewToEntry } from "~/plugins/cms/linkContentReviewToEntry";
import { linkWorkflowToEntry } from "~/plugins/cms/linkWorkflowToEntry";
import { triggerContentReview } from "~/plugins/cms/triggerContentReview";
import { updateContentReviewStatus } from "~/plugins/cms/updateContentReviewStatus";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryApwSettingsGetterPlugin } from "~/plugins/cms/CmsEntryApwSettingsGetterPlugin";

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

    params.plugins.register(new CmsEntryApwSettingsGetterPlugin());

    apwEntryPlugins(params);

    linkContentReviewToEntry(params);

    linkWorkflowToEntry(params);

    triggerContentReview(params);

    updateContentReviewStatus(params);
};
