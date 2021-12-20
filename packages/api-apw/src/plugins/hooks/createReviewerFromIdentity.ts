import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { ApwContext } from "~/types";

export const createReviewerFromIdentity = () =>
    new ContextPlugin<SecurityContext & ApwContext>(async context => {
        /**
         * A way to replicate our identity in CMS at some point.
         */
        context.security.onLogin.subscribe(async ({ identity }) => {
            let reviewer;
            try {
                [[reviewer]] = await context.apw.reviewer.list({
                    where: { identityId: identity.id },
                    limit: 1
                });
            } catch (e) {
                if (e.message === "index_not_found_exception") {
                    // Do nothing
                } else {
                    throw e;
                }
            }

            if (!reviewer) {
                await context.apw.reviewer.create({
                    identityId: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                });
            }
        });
    });
