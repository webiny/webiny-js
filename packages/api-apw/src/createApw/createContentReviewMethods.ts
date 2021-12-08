import { ApwContext, ApwContentReviewCrud, ApwContentReviewStepStatus } from "~/types";

export function createContentReviewMethods(context: ApwContext): ApwContentReviewCrud {
    return {
        async getModel() {
            return await context.cms.getModel("apwContentReviewModelDefinition");
        },
        async get(id) {
            const model = await this.getModel();
            return await context.cms.getEntry(model, {
                where: {
                    id
                }
            });
        },
        async list(params) {
            const model = await this.getModel();
            return await context.cms.listEntries(model, params);
        },
        async create(data) {
            const model = await this.getModel();
            return await context.cms.createEntry(model, {
                ...data,
                steps: []
            });
        },
        async update(id, data) {
            const model = await this.getModel();
            const existingEntry = await this.get(id);

            return await context.cms.updateEntry(model, id, {
                ...existingEntry.values,
                ...data
            });
        },
        async delete(id) {
            const model = await this.getModel();
            await context.cms.deleteEntry(model, id);
            return true;
        },
        async provideSignOff(id, stepSlug) {
            const entry = await this.get(id);
            const stepIndex = entry.values.steps.findIndex(step => step.slug === stepSlug);
            const step = entry.values.steps[stepIndex];

            const identity = context.security.getIdentity();
            // Check if the pre-conditions for "sign-off" are meet.
            if (step.pendingChangeRequests > 0) {
                throw {
                    code: "PENDING_CHANGE_REQUESTS",
                    message: `Change requests are pending couldn't provide sign-off.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }

            if (step.status !== ApwContentReviewStepStatus.ACTIVE) {
                throw {
                    code: "STEP_NOT_ACTIVE",
                    message: `Step needs to be in active state before providing sign-off.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }

            /*
             * Provide sign-off for give step.
             */
            await context.advancedPublishingWorkflow.contentReview.update(id, {
                steps: entry.values.steps.map((step, index) => {
                    if (step.slug === stepSlug) {
                        return {
                            ...step,
                            status: ApwContentReviewStepStatus.DONE,
                            signOffProvidedOn: new Date().toISOString(),
                            signOffProvidedBy: identity
                        };
                    }
                    /**
                     * Set next step status as "active".
                     */
                    if (index === stepIndex + 1) {
                        return {
                            ...step,
                            // TODO: @ashutosh assign status based on workflow step type.
                            status: ApwContentReviewStepStatus.ACTIVE
                        };
                    }

                    return step;
                })
            });
            return true;
        },
        async retractSignOff(id, stepSlug) {
            const entry = await this.get(id);
            const stepIndex = entry.values.steps.findIndex(step => step.slug === stepSlug);
            const step = entry.values.steps[stepIndex];

            // Check if the pre-conditions for retracting "sign-off" are meet.

            if (step.status !== ApwContentReviewStepStatus.DONE) {
                throw {
                    code: "NO_SIGN_OFF_PROVIDED",
                    message: `Sign-off must be provided in order for it to be retracted.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }

            /*
             * Retract sign-off for give step.
             */
            await context.advancedPublishingWorkflow.contentReview.update(id, {
                steps: entry.values.steps.map((step, index) => {
                    if (step.slug === stepSlug) {
                        return {
                            ...step,
                            status: ApwContentReviewStepStatus.ACTIVE,
                            signOffProvidedOn: null,
                            signOffProvidedBy: null
                        };
                    }
                    /**
                     * Set next step status as "inactive".
                     */
                    if (index === stepIndex + 1) {
                        return {
                            ...step,
                            // TODO: @ashutosh assign status based on workflow step type.
                            status: ApwContentReviewStepStatus.INACTIVE
                        };
                    }

                    return step;
                })
            });
            return true;
        }
    };
}
