import pick from "lodash/pick";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { ApwStorageOperations } from "~/types";

interface CreateApwStorageOperationsParams {
    cms: HeadlessCms;
}

function getFieldValues(object, fields) {
    return { ...pick(object, fields), ...object.values };
}

const baseFields = ["id", "createdBy", "createdOn", "savedOn"];

export const createStorageOperations = ({
    cms
}: CreateApwStorageOperationsParams): ApwStorageOperations => {
    return {
        getReviewerModel() {
            return cms.getModel("apwReviewerModelDefinition");
        },
        async getReviewer({ id }) {
            const model = await this.getReviewerModel();
            const entry = await cms.getEntryById(model, id);
            return getFieldValues(entry, baseFields);
        },
        async listReviewers(params) {
            const model = await this.getReviewerModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createReviewer(params) {
            const model = await this.getReviewerModel();
            const entry = await cms.createEntry(model, params.data);
            return getFieldValues(entry, baseFields);
        },
        async updateReviewer(params) {
            const model = await this.getReviewerModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.getReviewer({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteReviewer(params) {
            const model = await this.getReviewerModel();
            await cms.deleteEntry(model, params.id);
            return true;
        },
        getWorkflowModel() {
            return cms.getModel("apwWorkflowModelDefinition");
        },

        async getWorkflow({ id }) {
            const model = await this.getWorkflowModel();
            const entry = await cms.getEntryById(model, id);
            return getFieldValues(entry, baseFields);
        },
        async listWorkflows(params) {
            const model = await this.getWorkflowModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createWorkflow(params) {
            const model = await this.getWorkflowModel();
            const entry = await cms.createEntry(model, params.data);
            return getFieldValues(entry, baseFields);
        },
        async updateWorkflow(params) {
            const model = await this.getWorkflowModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.getWorkflow({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteWorkflow(params) {
            const model = await this.getWorkflowModel();
            await cms.deleteEntry(model, params.id);
            return true;
        },
        getContentReviewModel() {
            return cms.getModel("apwContentReviewModelDefinition");
        },

        async getContentReview({ id }) {
            const model = await this.getContentReviewModel();
            const entry = await cms.getEntryById(model, id);
            return getFieldValues(entry, baseFields);
        },
        async listContentReviews(params) {
            const model = await this.getContentReviewModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createContentReview(params) {
            const model = await this.getContentReviewModel();
            const entry = await cms.createEntry(model, params.data);
            return getFieldValues(entry, baseFields);
        },
        async updateContentReview(params) {
            const model = await this.getContentReviewModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.getContentReview({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteContentReview(params) {
            const model = await this.getContentReviewModel();
            await cms.deleteEntry(model, params.id);
            return true;
        },
        getChangeRequestModel() {
            return cms.getModel("apwChangeRequestModelDefinition");
        },

        async getChangeRequest({ id }) {
            const model = await this.getChangeRequestModel();
            const entry = await cms.getEntryById(model, id);
            return getFieldValues(entry, baseFields);
        },
        async listChangeRequests(params) {
            const model = await this.getChangeRequestModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createChangeRequest(params) {
            const model = await this.getChangeRequestModel();
            const entry = await cms.createEntry(model, params.data);
            return getFieldValues(entry, baseFields);
        },
        async updateChangeRequest(params) {
            const model = await this.getChangeRequestModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.getChangeRequest({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteChangeRequest(params) {
            const model = await this.getChangeRequestModel();
            await cms.deleteEntry(model, params.id);
            return true;
        },
        getCommentModel() {
            return cms.getModel("apwCommentModelDefinition");
        },

        async getComment({ id }) {
            const model = await this.getCommentModel();
            const entry = await cms.getEntryById(model, id);
            return getFieldValues(entry, baseFields);
        },
        async listComments(params) {
            const model = await this.getCommentModel();
            const [entries, meta] = await cms.listLatestEntries(model, params);
            const all = await Promise.all(entries.map(entry => getFieldValues(entry, baseFields)));
            return [all, meta];
        },
        async createComment(params) {
            const model = await this.getCommentModel();
            const refModel = await this.getChangeRequestModel();
            const entry = await cms.createEntry(model, {
                ...params.data,
                changeRequest: {
                    ...params.data.changeRequest,
                    modelId: refModel.modelId
                }
            });

            return getFieldValues(entry, baseFields);
        },
        async updateComment(params) {
            const model = await this.getCommentModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.getComment({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteComment(params) {
            const model = await this.getCommentModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
