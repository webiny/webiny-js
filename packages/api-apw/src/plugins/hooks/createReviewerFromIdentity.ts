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
        const email = identity?.email || null;
        /**
         * Create a reviewer if it doesn't exist already.
         */
        if (!reviewer) {
            try {
                await apw.reviewer.create({
                    identityId: identity.id,
                    displayName: identity.displayName,
                    type: identity.type,
                    email
                });
            } catch (ex) {
                console.log(
                    `There was an error while creating reviewer with identity: ${identity.id}`
                );
                console.log(JSON.stringify(ex));
                throw ex;
            }
            return;
        }
        /**
         * If "displayName" doesn't match it means it has been updated in the identity,
         * therefore, we need to update it on reviewer as well keep them in sync.
         */
        const update = reviewer.displayName !== identity.displayName || reviewer.email !== email;
        if (!update) {
            return;
        }
        try {
            await apw.reviewer.update(reviewer.id, {
                identityId: reviewer.identityId,
                type: reviewer.type,
                displayName: identity.displayName,
                email
            });
        } catch (ex) {
            console.log(`There was an error while updating reviewer: ${reviewer.id}`);
            console.log(JSON.stringify(ex));
            throw ex;
        }
    });
};
