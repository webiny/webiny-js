import get from "lodash/get";
import { createTopic } from "@webiny/pubsub";
import Error from "@webiny/error";
import {
    AdvancedPublishingWorkflow,
    ApwContentReview,
    ApwContentReviewCrud,
    ApwContentReviewStatus,
    ApwContentReviewStepStatus,
    ApwReviewerCrud,
    ApwScheduleActionData,
    ApwWorkflowStepTypes,
    CreateApwContentReviewParams,
    CreateApwParams,
    OnContentReviewAfterCreateTopicParams,
    OnContentReviewAfterDeleteTopicParams,
    OnContentReviewAfterUpdateTopicParams,
    OnContentReviewBeforeCreateTopicParams,
    OnContentReviewBeforeDeleteTopicParams,
    OnContentReviewBeforeListTopicParams,
    OnContentReviewBeforeUpdateTopicParams,
    UpdateApwContentReviewParams
} from "~/types";
import { getNextStepStatus, hasReviewer } from "~/plugins/utils";
import {
    NoSignOffProvidedError,
    NotAuthorizedError,
    PendingChangeRequestsError,
    StepInActiveError,
    StepMissingError
} from "~/utils/errors";
import { ApwScheduleActionTypes } from "~/scheduler/types";
import {
    checkValidDateTime,
    filterContentReviewsByRequiresMyAttention,
    getPendingRequiredSteps,
    INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META
} from "./utils";
import { getContentApwSettingsPlugin } from "~/utils/contentApwSettingsPlugin";
import { PluginsContainer } from "@webiny/plugins";

export interface CreateContentReviewMethodsParams extends CreateApwParams {
    getReviewer: ApwReviewerCrud["get"];
    getContentGetter: AdvancedPublishingWorkflow["getContentGetter"];
    getContentPublisher: AdvancedPublishingWorkflow["getContentPublisher"];
    getContentUnPublisher: AdvancedPublishingWorkflow["getContentUnPublisher"];
    plugins: PluginsContainer;
}

export function createContentReviewMethods(
    params: CreateContentReviewMethodsParams
): ApwContentReviewCrud {
    const {
        getIdentity,
        storageOperations,
        getReviewer,
        getContentGetter,
        getContentPublisher,
        getContentUnPublisher,
        scheduler,
        handlerClient,
        getTenant,
        getLocale,
        plugins
    } = params;

    // create
    const onContentReviewBeforeCreate = createTopic<OnContentReviewBeforeCreateTopicParams>(
        "apw.onContentReviewBeforeCreate"
    );
    const onContentReviewAfterCreate = createTopic<OnContentReviewAfterCreateTopicParams>(
        "apw.onContentReviewAfterCreate"
    );
    // update
    const onContentReviewBeforeUpdate = createTopic<OnContentReviewBeforeUpdateTopicParams>(
        "apw.onContentReviewBeforeUpdate"
    );
    const onContentReviewAfterUpdate = createTopic<OnContentReviewAfterUpdateTopicParams>(
        "apw.onContentReviewAfterUpdate"
    );
    // delete
    const onContentReviewBeforeDelete = createTopic<OnContentReviewBeforeDeleteTopicParams>(
        "apw.onContentReviewBeforeDelete"
    );
    const onContentReviewAfterDelete = createTopic<OnContentReviewAfterDeleteTopicParams>(
        "apw.onContentReviewAfterDelete"
    );
    // list
    const onContentReviewBeforeList = createTopic<OnContentReviewBeforeListTopicParams>(
        "apw.onContentReviewBeforeList"
    );
    return {
        /**
         * Lifecycle events
         */
        onContentReviewBeforeCreate,
        onContentReviewAfterCreate,
        onContentReviewBeforeUpdate,
        onContentReviewAfterUpdate,
        onContentReviewBeforeDelete,
        onContentReviewAfterDelete,
        onContentReviewBeforeList,
        async get(id) {
            return storageOperations.getContentReview({ id });
        },
        async list(params) {
            const where = params.where || {};

            await onContentReviewBeforeList.publish({
                where
            });

            if (where.reviewStatus === "requiresMyAttention") {
                return filterContentReviewsByRequiresMyAttention({
                    listParams: {
                        ...params,
                        where
                    },
                    listContentReviews: storageOperations.listContentReviews,
                    getReviewer,
                    getIdentity
                });
            }

            return storageOperations.listContentReviews({
                ...params,
                where
            });
        },
        async create(data: Omit<CreateApwContentReviewParams, "reviewStatus">) {
            const input: CreateApwContentReviewParams = {
                ...data,
                reviewStatus: ApwContentReviewStatus.UNDER_REVIEW
            };
            await onContentReviewBeforeCreate.publish({ input });

            const contentReview = await storageOperations.createContentReview({
                data: input
            });

            await onContentReviewAfterCreate.publish({ contentReview });

            return contentReview;
        },
        async update(id, data: UpdateApwContentReviewParams) {
            const original = await storageOperations.getContentReview({ id });

            await onContentReviewBeforeUpdate.publish({ original, input: { id, data } });

            const contentReview = await storageOperations.updateContentReview({
                id,
                data
            });

            await onContentReviewAfterUpdate.publish({
                original,
                input: { id, data },
                contentReview
            });

            return contentReview;
        },
        async delete(id) {
            const contentReview = await storageOperations.getContentReview({ id });

            await onContentReviewBeforeDelete.publish({ contentReview });

            await storageOperations.deleteContentReview({ id });

            await onContentReviewAfterDelete.publish({ contentReview });

            return true;
        },
        async provideSignOff(this: ApwContentReviewCrud, id, stepId) {
            const entry: ApwContentReview = await this.get(id);
            const { steps, reviewStatus } = entry;
            const stepIndex = steps.findIndex(step => step.id === stepId);
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
                throw new NotAuthorizedError({ entry, input: { id, step: stepId } });
            }
            /**
             *  Don't allow sign off, if previous step is of "mandatory_blocking" type and undone.
             */
            if (
                previousStep &&
                previousStep.status !== ApwContentReviewStepStatus.DONE &&
                previousStep.type === ApwWorkflowStepTypes.MANDATORY_BLOCKING
            ) {
                throw new StepMissingError({ entry, input: { id, step: stepId } });
            }
            /**
             *  Don't allow sign off, if there are pending change requests.
             */
            if (currentStep.pendingChangeRequests > 0) {
                throw new PendingChangeRequestsError({ entry, input: { id, step: stepId } });
            }
            /**
             *  Don't allow sign off, if current step is not in "active" state.
             */
            if (currentStep.status !== ApwContentReviewStepStatus.ACTIVE) {
                throw new StepInActiveError({ entry, input: { id, step: stepId } });
            }
            let previousStepStatus: ApwContentReviewStepStatus;
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
             * Check for pending steps
             */
            let newStatus = reviewStatus;
            const pendingRequiredSteps = getPendingRequiredSteps(
                updatedSteps,
                step => typeof step.signOffProvidedOn !== "string"
            );

            /**
             * If there are no required steps that are pending, set the status to "READY_TO_BE_PUBLISHED".
             */
            if (pendingRequiredSteps.length === 0) {
                newStatus = ApwContentReviewStatus.READY_TO_BE_PUBLISHED;
            }

            /**
             * Save updated steps.
             */
            await this.update(id, {
                steps: updatedSteps,
                reviewStatus: newStatus
            });
            return true;
        },
        async retractSignOff(this: ApwContentReviewCrud, id, stepId) {
            const entry: ApwContentReview = await this.get(id);
            const { steps, reviewStatus } = entry;
            const stepIndex = steps.findIndex(step => step.id === stepId);
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
                throw new NotAuthorizedError({ entry, input: { id, step: stepId } });
            }
            /**
             *  Don't allow, if step in not "done" i.e. no sign-off was provided for it.
             */
            if (currentStep.status !== ApwContentReviewStepStatus.DONE) {
                throw new NoSignOffProvidedError({ entry, input: { id, step: stepId } });
            }
            let previousStepStatus: ApwContentReviewStepStatus;

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

            /**
             * Check for pending steps
             */
            let newStatus = reviewStatus;
            const pendingRequiredSteps = getPendingRequiredSteps(
                updatedSteps,
                step => step.signOffProvidedOn === null
            );
            /**
             * If there are required steps that are pending, set the status to "UNDER_REVIEW".
             */
            if (pendingRequiredSteps.length !== 0) {
                newStatus = ApwContentReviewStatus.UNDER_REVIEW;
            }

            await this.update(id, {
                steps: updatedSteps,
                reviewStatus: newStatus
            });
            return true;
        },
        async isReviewRequired(data) {
            const contentGetter = getContentGetter(data.type);
            const content = await contentGetter(data.id, data.settings);

            let isReviewRequired = false;
            let contentReviewId: string | null = null;

            const contentApwSettingsPlugin = getContentApwSettingsPlugin({
                plugins,
                type: data.type
            });

            if (contentApwSettingsPlugin) {
                contentReviewId = contentApwSettingsPlugin.getContentReviewId(content);
                const workflowId = contentApwSettingsPlugin.getWorkflowId(content);
                if (workflowId) {
                    isReviewRequired = true;
                }
            }

            return {
                isReviewRequired,
                contentReviewId
            };
        },
        async publishContent(this: ApwContentReviewCrud, id: string, datetime) {
            const { content, reviewStatus } = await this.get(id);
            const identity = getIdentity();

            if (reviewStatus !== ApwContentReviewStatus.READY_TO_BE_PUBLISHED) {
                throw new Error({
                    message: `Cannot publish content because it is not yet ready to be published.`,
                    code: "NOT_READY_TO_BE_PUBLISHED",
                    data: {
                        id,
                        status: reviewStatus,
                        content
                    }
                });
            }

            checkValidDateTime(datetime);

            /**
             * If datetime is present it means we're scheduling this action.
             * And if not, we are publishing immediately.
             */
            if (!datetime) {
                const contentPublisher = getContentPublisher(content.type);

                await contentPublisher(content.id, content.settings);

                return true;
            }

            const data: ApwScheduleActionData = {
                action: ApwScheduleActionTypes.PUBLISH,
                type: content.type,
                entryId: content.id,
                modelId: content.settings?.modelId,
                datetime
            };
            const scheduledActionId = await this.scheduleAction(data);
            /**
             * Update scheduled related meta data.
             */
            await this.update(id, {
                content: {
                    ...content,
                    scheduledOn: datetime,
                    scheduledBy: identity.id,
                    scheduledActionId
                }
            });

            return true;
        },
        async unpublishContent(this: ApwContentReviewCrud, id: string, datetime) {
            const { content, reviewStatus } = await this.get(id);
            const identity = getIdentity();

            if (reviewStatus !== ApwContentReviewStatus.PUBLISHED) {
                throw new Error({
                    message: `Cannot unpublish content because it is not yet published.`,
                    code: "NOT_YET_PUBLISHED",
                    data: {
                        id,
                        status: reviewStatus,
                        content
                    }
                });
            }
            checkValidDateTime(datetime);

            /**
             * If datetime is present it means we're scheduling this action.
             * If not, we are unpublishing immediately.
             */
            if (!datetime) {
                const contentUnPublisher = getContentUnPublisher(content.type);

                await contentUnPublisher(content.id, content.settings);

                return true;
            }

            const scheduledActionId = await this.scheduleAction({
                action: ApwScheduleActionTypes.UNPUBLISH,
                type: content.type,
                entryId: content.id,
                modelId: content.settings?.modelId,
                datetime
            });
            /**
             * Update scheduled related meta data.
             */
            await this.update(id, {
                content: {
                    ...content,
                    scheduledOn: datetime,
                    scheduledBy: identity.id,
                    scheduledActionId
                }
            });

            return true;
        },
        async scheduleAction(data) {
            // Save input in DB
            const scheduledAction = await scheduler.create(data);
            /**
             * This function contains logic of lambda invocation.
             * Current we're not mocking it, therefore, we're just returning true.
             */
            if (process.env.NODE_ENV === "test") {
                return scheduledAction.id;
            }
            // Invoke handler
            await handlerClient.invoke({
                name: String(process.env.APW_SCHEDULER_SCHEDULE_ACTION_HANDLER),
                payload: {
                    tenant: getTenant().id,
                    locale: getLocale().code
                },
                await: false,
                description: "APW scheduler handler"
            });
            return scheduledAction.id;
        },
        async deleteScheduledAction(id) {
            const contentReview = await this.get(id);
            const scheduledActionId = get(contentReview, "content.scheduledActionId");

            /**
             * Check if there is any action scheduled for this "content review".
             */
            if (!scheduledActionId) {
                throw new Error({
                    message: `There is no action scheduled for content review.`,
                    code: "NO_ACTION_SCHEDULED",
                    data: {
                        id
                    }
                });
            }
            /**
             * Delete scheduled action.
             */
            await scheduler.delete(scheduledActionId);

            /**
             * Reset scheduled related meta data.
             */
            await this.update(id, {
                content: {
                    ...contentReview.content,
                    ...INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META
                }
            });

            return true;
        }
    };
}
