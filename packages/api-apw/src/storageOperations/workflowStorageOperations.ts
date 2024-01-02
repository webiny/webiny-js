import { ApwWorkflow, CreateApwWorkflowParams } from "~/types";
import { ApwStorageOperations, ApwWorkflowStorageOperations } from "./types";
import { CreateApwStorageOperationsParams } from "~/storageOperations/index";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";
import WebinyError from "@webiny/error";
import { WORKFLOW_MODEL_ID } from "~/storageOperations/models/workflow.model";

type ReviewersRefInput = CreateApwWorkflowParams<{ modelId: string; id: string }>;

const formatReviewersForRefInput = (
    data: CreateApwWorkflowParams,
    modelId: string
): ReviewersRefInput => {
    return {
        ...data,
        steps: data.steps.map(step => ({
            ...step,
            reviewers: step.reviewers.map(id => ({
                id,
                modelId
            }))
        }))
    };
};

export const createWorkflowStorageOperations = (
    params: CreateApwStorageOperationsParams
): ApwWorkflowStorageOperations => {
    const { cms, security } = params;
    const getWorkflowModel = async () => {
        const model = await security.withoutAuthorization(async () => {
            return cms.getModel(WORKFLOW_MODEL_ID);
        });
        if (!model) {
            throw new WebinyError(
                `Could not find "${WORKFLOW_MODEL_ID}" model.`,
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };
    const getWorkflow: ApwWorkflowStorageOperations["getWorkflow"] = async ({ id }) => {
        const model = await getWorkflowModel();
        const entry = await security.withoutAuthorization(async () => {
            return cms.getEntryById(model, id);
        });
        return pickEntryFieldValues(entry);
    };
    return {
        getWorkflowModel,
        getWorkflow,
        async listWorkflows(params) {
            const model = await getWorkflowModel();

            const [entries, meta] = await security.withoutAuthorization(async () => {
                return cms.listLatestEntries(model, {
                    ...params,
                    where: {
                        ...params.where
                    }
                });
            });
            return [entries.map(pickEntryFieldValues<ApwWorkflow>), meta];
        },
        async createWorkflow(this: ApwStorageOperations, params) {
            const model = await getWorkflowModel();
            const reviewerModel = await this.getReviewerModel();

            const data = formatReviewersForRefInput(params.data, reviewerModel.modelId);

            const entry = await security.withoutAuthorization(async () => {
                return cms.createEntry(model, data);
            });

            return pickEntryFieldValues(entry);
        },
        async updateWorkflow(this: ApwStorageOperations, params) {
            const model = await getWorkflowModel();
            const reviewerModel = await this.getReviewerModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getWorkflow({ id: params.id });
            const input = {
                ...existingEntry,
                ...params.data,
                savedOn: new Date()
            };
            const data = formatReviewersForRefInput(
                input as CreateApwWorkflowParams,
                reviewerModel.modelId
            );

            const entry = await security.withoutAuthorization(async () => {
                return cms.updateEntry(model, params.id, data);
            });

            return pickEntryFieldValues(entry);
        },
        async deleteWorkflow(params) {
            const model = await getWorkflowModel();

            await security.withoutAuthorization(async () => {
                return cms.deleteEntry(model, params.id);
            });
            return true;
        }
    };
};
