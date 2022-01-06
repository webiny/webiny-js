import {
    ApwContentReviewCrud,
    ApwContentReviewStepStatus,
    ApwWorkflowStepTypes,
    ApwContentReviewStatus,
    CreateApwParams,
    ApwReviewerCrud,
    ApwContentReview
} from "~/types";
import { hasReviewer, getNextStepStatus } from "~/plugins/utils";
import {
    NoSignOffProvidedError,
    NotAuthorizedError,
    PendingChangeRequestsError,
    StepInActiveError,
    StepMissingError
} from "~/utils/errors";

interface CreateContentReviewMethodsParams extends CreateApwParams {
    getReviewer: ApwReviewerCrud["get"];
}

export function createContentReviewMethods({
    getIdentity,
    storageOperations,
    getReviewer
}: CreateContentReviewMethodsParams): ApwContentReviewCrud {
    return {
        async getModel() {
            return storageOperations.getContentReviewModel();
        },
        async get(id) {
            return storageOperations.getContentReview({ id });
        },
        async list(params) {
            return storageOperations.listContentReviews(params);
        },
        async create(data) {
            return storageOperations.createContentReview({
                data: {
                    ...data,
                    steps: [],
                    status: ApwContentReviewStatus.UNDER_REVIEW
                }
            });
        },
        async update(id, data) {
            return storageOperations.updateContentReview({
                id,
                data
            });
        },
        async delete(id) {
            await storageOperations.deleteContentReview({ id });
            return true;
        },
        async provideSignOff(id, stepSlug) {
            const entry: ApwContentReview = await this.get(id);
            const { steps } = entry;
            const stepIndex = steps.findIndex(step => step.slug === stepSlug);
            const currentStep = steps[stepIndex];
            const previousStep = steps[stepIndex - 1];

            const identity = getIdentity();
            const hasPermission = await hasReviewer({
                getReviewer,
                identity,
                step: currentStep
            });

            /**
             *  Check whether the sign-off is requested by a reviewer.
             */
            if (!hasPermission) {
                throw new NotAuthorizedError({ entry, input: { id, step: stepSlug } });
            }
            /**
             *  Don't allow sign off, if previous step is of "mandatory_blocking" type and undone.
             */
            if (
                previousStep &&
                previousStep.status !== ApwContentReviewStepStatus.DONE &&
                previousStep.type === ApwWorkflowStepTypes.MANDATORY_BLOCKING
            ) {
                throw new StepMissingError({ entry, input: { id, step: stepSlug } });
            }
            /**
             *  Don't allow sign off, if there are pending change requests.
             */
            if (currentStep.pendingChangeRequests > 0) {
                throw new PendingChangeRequestsError({ entry, input: { id, step: stepSlug } });
            }
            /**
             *  Don't allow sign off, if current step is not in "active" state.
             */
            if (currentStep.status !== ApwContentReviewStepStatus.ACTIVE) {
                throw new StepInActiveError({ entry, input: { id, step: stepSlug } });
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
                    const previousStep = steps[index - 1];

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
            await this.update(id, {
                steps: updatedSteps
            });
            return true;
        },
        async retractSignOff(id, stepSlug) {
            const entry: ApwContentReview = await this.get(id);
            const { steps } = entry;
            const stepIndex = steps.findIndex(step => step.slug === stepSlug);
            const currentStep = steps[stepIndex];

            const identity = getIdentity();

            const hasPermission = await hasReviewer({
                getReviewer,
                identity,
                step: currentStep
            });

            /**
             *  Check whether the retract sign-off is requested by a reviewer.
             */
            if (!hasPermission) {
                throw new NotAuthorizedError({ entry, input: { id, step: stepSlug } });
            }
            /**
             *  Don't allow, if step in not "done" i.e. no sign-off was provided for it.
             */
            if (currentStep.status !== ApwContentReviewStepStatus.DONE) {
                throw new NoSignOffProvidedError({ entry, input: { id, step: stepSlug } });
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
                    const previousStep = steps[index - 1];

                    previousStepStatus = getNextStepStatus(previousStep.type, previousStepStatus);

                    return {
                        ...step,
                        status: previousStepStatus
                    };
                }

                return step;
            });

            await this.update(id, {
                steps: updatedSteps
            });
            return true;
        }
    };
}
