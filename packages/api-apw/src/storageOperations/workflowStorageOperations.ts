import { CreateApwWorkflowParams } from "~/types";
import { ApwStorageOperations, ApwWorkflowStorageOperations } from "./types";
import {
    baseFields,
    CreateApwStorageOperationsParams,
    getFieldValues
} from "~/storageOperations/index";
import WebinyError from "@webiny/error";

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

export const createWorkflowStorageOperations = ({
    cms
}: Pick<CreateApwStorageOperationsParams, "cms">): ApwWorkflowStorageOperations => {
    const getWorkflowModel = async () => {
        const model = await cms.getModel("apwWorkflowModelDefinition");
        if (!model) {
            throw new WebinyError(
                "Could not find `apwWorkflowModelDefinition` model.",
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };
    const getWorkflow: ApwWorkflowStorageOperations["getWorkflow"] = async ({ id }) => {
        const model = await getWorkflowModel();
        const entry = await cms.getEntryById(model, id);
        return getFieldValues(entry, baseFields);
    };
    return {
        getWorkflowModel,
        getWorkflow,
        async listWorkflows(params) {
            const model = await getWorkflowModel();
            const [entries, meta] = await cms.listLatestEntries(model, {
                ...params
            });
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createWorkflow(this: ApwStorageOperations, params) {
            const model = await getWorkflowModel();
            const reviewerModel = await this.getReviewerModel();

            const data = formatReviewersForRefInput(params.data, reviewerModel.modelId);
            const entry = await cms.createEntry(model, data);

            return getFieldValues(entry, baseFields);
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
                ...params.data
            };
            const data = formatReviewersForRefInput(
                input as CreateApwWorkflowParams,
                reviewerModel.modelId
            );
            const entry = await cms.updateEntry(model, params.id, data);
            return getFieldValues(entry, baseFields);
        },
        async deleteWorkflow(params) {
            const model = await getWorkflowModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
