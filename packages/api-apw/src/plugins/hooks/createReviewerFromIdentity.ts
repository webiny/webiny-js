import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { ApwContext } from "~/types";

export const createReviewerFromIdentity = () =>
    new ContextPlugin<SecurityContext & ApwContext>(async context => {
        /**
         * A way to replicate our identity in CMS at some point.
         */
        context.security.onLogin.subscribe(async ({ identity }) => {
            const [[reviewer]] = await context.advancedPublishingWorkflow.reviewer.list({
                where: { identityId: identity.id },
                limit: 1
            });

            if (reviewer) {
                return;
            }

            await context.advancedPublishingWorkflow.reviewer.create({
                identityId: identity.id,
                displayName: identity.displayName
            });
        });
    });
