import { ApwContext } from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { apwEntryPlugins } from "~/plugins/cms/apwEntryPlugins";
import { linkContentReviewToEntry } from "~/plugins/cms/linkContentReviewToEntry";
import { linkWorkflowToEntry } from "~/plugins/cms/linkWorkflowToEntry";
import { triggerContentReview } from "~/plugins/cms/triggerContentReview";
import { updateContentReviewStatus } from "~/plugins/cms/updateContentReviewStatus";

export const cmsEntryContext = () => {
    return new ContextPlugin<ApwContext>(async context => {
        /**
         * We do not need to assign anything if no apw or cms in the context.
         * This might happen on options request.
         */
        if (!context.apw || !context.cms) {
            return;
        }

        apwEntryPlugins(context);

        linkContentReviewToEntry(context);

        linkWorkflowToEntry(context);

        triggerContentReview(context);

        triggerContentReview(context);

        updateContentReviewStatus(context);
    });
};
