import { LifeCycleHookCallbackParams } from "~/types";

export const createReviewerFromIdentity = ({ security, apw }: LifeCycleHookCallbackParams) => {
    /**
     * Replicate identity in "AdvancedPublishingWorkflow" system after login.
     */
    security.onAfterLogin.subscribe(async ({ identity }) => {
        let reviewer;
        try {
            [[reviewer]] = await apw.reviewer.list({
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
        /**
         * Create a reviewer if it doesn't exist already.
         */
        if (!reviewer) {
            await apw.reviewer.create({
                identityId: identity.id,
                displayName: identity.displayName,
                type: identity.type
            });
            return;
        }
        /**
         * If "displayName" doesn't match it means it has been updated in the identity,
         * therefore, we need to update it on reviewer as well keep them in sync.
         */
        if (reviewer.displayName !== identity.displayName) {
            await apw.reviewer.update(reviewer.id, {
                identityId: reviewer.identityId,
                type: reviewer.type,
                displayName: identity.displayName
            });
        }
    });
};
