import {
    ApwContext,
    ApwContentReviewCrud,
    ApwContentReviewStepStatus,
    ApwWorkflowStep,
    ApwWorkflowStepTypes,
    ApwContentReviewStatus
} from "~/types";
import { getWorkflowIdFromContent } from "~/plugins/hooks/initializeContentReviewSteps";
import { getValue, hasReviewer, getNextStepStatus } from "~/plugins/utils";

export function createContentReviewMethods(context: ApwContext): ApwContentReviewCrud {
    return {
        async getModel() {
            return await context.cms.getModel("apwContentReviewModelDefinition");
        },
        async get(id) {
            const model = await this.getModel();
            return await context.cms.getEntryById(model, id);
        },
        async list(params) {
            const model = await this.getModel();
            return await context.cms.listLatestEntries(model, params);
        },
        async create(data) {
            const model = await this.getModel();
            return await context.cms.createEntry(model, {
                ...data,
                steps: [],
                status: ApwContentReviewStatus.UNDER_REVIEW
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
            const steps = getValue(entry, "steps");
            const stepIndex = steps.findIndex(step => step.slug === stepSlug);
            const currentStep = steps[stepIndex];
            const previousStep = steps[stepIndex - 1];

            const identity = context.security.getIdentity();
            /**
             * TODO: @ashutosh
             * Maybe we should copy the entire step data from "Workflow" while creating a "Content Review".
             */
            const workflowId = await getWorkflowIdFromContent(context, entry.values.content);
            const workflow = await context.apw.workflow.get(workflowId);
            const workflowSteps: ApwWorkflowStep[] = getValue(workflow, "steps");
            const previousStepFromWorkflow = workflowSteps[stepIndex - 1];

            const hasPermission = await hasReviewer({
                context,
                identity,
                workflowStep: workflowSteps[stepIndex]
            });

            /**
             *  Check whether the sign-off is requested by a reviewer.
             */
            if (!hasPermission) {
                throw {
                    code: "NOT_AUTHORISED",
                    message: `Not a reviewer, couldn't provide sign-off.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }
            /**
             *  Don't allow sign off, if previous step is of "mandatory_blocking" type and undone.
             */
            if (
                previousStep &&
                previousStep.status !== ApwContentReviewStepStatus.DONE &&
                previousStepFromWorkflow.type === ApwWorkflowStepTypes.MANDATORY_BLOCKING
            ) {
                throw {
                    code: "MISSING_STEP",
                    message: `Please complete previous steps first.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }
            /**
             *  Don't allow sign off, if there are pending change requests.
             */
            if (currentStep.pendingChangeRequests > 0) {
                throw {
                    code: "PENDING_CHANGE_REQUESTS",
                    message: `Change requests are pending couldn't provide sign-off.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }
            /**
             *  Don't allow sign off, if current step is not in "active" state.
             */
            if (currentStep.status !== ApwContentReviewStepStatus.ACTIVE) {
                throw {
                    code: "STEP_NOT_ACTIVE",
                    message: `Step needs to be in active state before providing sign-off.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }
            let previousStepStatus;
            /*
             * Provide sign-off for give step.
             */
            const updatedSteps = steps.map((step, index) => {
                if (index === stepIndex) {
                    previousStepStatus = ApwContentReviewStepStatus.DONE;
                    return {
                        ...step,
                        status: ApwContentReviewStepStatus.DONE,
                        signOffProvidedOn: new Date().toISOString(),
                        signOffProvidedBy: identity
                    };
                }
                /**
                 * Update next steps status based on type.
                 */
                if (index > stepIndex) {
                    const previousStep = workflowSteps[index - 1];

                    previousStepStatus = getNextStepStatus(previousStep.type, previousStepStatus);
                    return {
                        ...step,
                        status: previousStepStatus
                    };
                }

                return step;
            });
            /**
             * Save updated steps.
             */
            await context.apw.contentReview.update(id, {
                steps: updatedSteps
            });
            return true;
        },
        async retractSignOff(id, stepSlug) {
            const entry = await this.get(id);
            const steps = getValue(entry, "steps");
            const stepIndex = steps.findIndex(step => step.slug === stepSlug);
            const currentStep = steps[stepIndex];
            const identity = context.security.getIdentity();
            /**
             * TODO: @ashutosh
             * Maybe we should copy the entire step data from "Workflow" while creating a "Content Review".
             */
            const workflowId = await getWorkflowIdFromContent(context, entry.values.content);
            const workflow = await context.apw.workflow.get(workflowId);
            const workflowSteps: ApwWorkflowStep[] = getValue(workflow, "steps");

            const hasPermission = await hasReviewer({
                context,
                identity,
                workflowStep: workflowSteps[stepIndex]
            });

            /**
             *  Check whether the retract sign-off is requested by a reviewer.
             */
            if (!hasPermission) {
                throw {
                    code: "NOT_AUTHORISED",
                    message: `Not a reviewer, couldn't retract sign-off.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }
            /**
             *  Don't allow, if step in not "done" i.e. no sign-off was provided for it.
             */
            if (currentStep.status !== ApwContentReviewStepStatus.DONE) {
                throw {
                    code: "NO_SIGN_OFF_PROVIDED",
                    message: `Sign-off must be provided in order for it to be retracted.`,
                    data: { entry, input: { id, step: stepSlug } }
                };
            }
            let previousStepStatus;

            /*
             * Retract sign-off for give step.
             */
            const updatedSteps = steps.map((step, index) => {
                if (index === stepIndex) {
                    previousStepStatus = ApwContentReviewStepStatus.ACTIVE;
                    return {
                        ...step,
                        status: previousStepStatus,
                        signOffProvidedOn: null,
                        signOffProvidedBy: null
                    };
                }
                /**
                 * Set next step status as "inactive".
                 */
                if (index > stepIndex) {
                    const previousStep = workflowSteps[index - 1];

                    previousStepStatus = getNextStepStatus(previousStep.type, previousStepStatus);

                    return {
                        ...step,
                        status: previousStepStatus
                    };
                }

                return step;
            });

            await context.apw.contentReview.update(id, {
                steps: updatedSteps
            });
            return true;
        }
    };
}
