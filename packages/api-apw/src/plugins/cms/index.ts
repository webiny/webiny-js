import { ApwContext } from "~/types";
import { apwEntryPlugins } from "~/plugins/cms/apwEntryPlugins";
import { linkContentReviewToEntry } from "~/plugins/cms/linkContentReviewToEntry";
import { linkWorkflowToEntry } from "~/plugins/cms/linkWorkflowToEntry";
import { triggerContentReview } from "~/plugins/cms/triggerContentReview";
import { updateContentReviewStatus } from "~/plugins/cms/updateContentReviewStatus";
import { CmsEntryApwSettingsGetterPlugin } from "~/plugins/cms/CmsEntryApwSettingsGetterPlugin";
import { createContentReviewModelFields } from "~/plugins/cms/contentReviewModelFields";

export const apwCmsHooks = (context: ApwContext) => {
    /**
     * We do not need to assign anything if no apw or cms in the context.
     * This might happen on options request.
     */
    if (!context.apw || !context.cms) {
        return;
    }

    context.plugins.register(new CmsEntryApwSettingsGetterPlugin());

    apwEntryPlugins(context);

    linkContentReviewToEntry(context);

    linkWorkflowToEntry(context);

    triggerContentReview(context);

    updateContentReviewStatus(context);
    /**
     * Add fields that will help with filtering.
     */
    createContentReviewModelFields(context);
};
