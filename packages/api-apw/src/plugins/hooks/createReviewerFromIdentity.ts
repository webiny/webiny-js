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

        if (!reviewer) {
            await apw.reviewer.create({
                identityId: identity.id,
                displayName: identity.displayName,
                type: identity.type
            });
        }
    });
};
