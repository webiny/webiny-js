import WebinyError from "@webiny/error";
import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import {
    AdvancedPublishingWorkflow,
    ApwWorkflow,
    ApwWorkflowApplications,
    WorkflowScopeTypes
} from "~/types";
import { workflowByCreatedOnDesc, workflowByPrecedenceDesc } from "~/plugins/utils";
import { CHANGE_REQUEST_MODEL_ID } from "~/storageOperations/models/changeRequest.model";
import { COMMENT_MODEL_ID } from "~/storageOperations/models/comment.model";
import { CONTENT_REVIEW_MODEL_ID } from "~/storageOperations/models/contentReview.model";
import { REVIEWER_MODEL_ID } from "~/storageOperations/models/reviewer.model";
import { WORKFLOW_MODEL_ID } from "~/storageOperations/models/workflow.model";

export const fetchModel = async (
    cms: HeadlessCms,
    id: string,
    settings?: { modelId?: string } | null
): Promise<CmsModel> => {
    if (!settings) {
        throw new WebinyError("Missing settings.", "SETTINGS_ERROR", {
            id
        });
    }
    const modelId = settings.modelId;
    if (!modelId) {
        throw new WebinyError("Missing modelId in settings.", "MODEL_ID_ERROR", {
            id,
            settings
        });
    }
    const model = await cms.getModel(modelId);
    if (model) {
        return model;
    }
    throw new WebinyError("There is no requested model in the system.", "MODEL_NOT_EXISTS", {
        id,
        settings
    });
};

export const getEntryTitle = (model: CmsModel, entry: CmsEntry): string => {
    const titleFieldId = model.titleFieldId;
    if (!titleFieldId || !entry.values[titleFieldId]) {
        return entry.id;
    }
    return entry.values[titleFieldId];
};

interface GetLatestEntryRevisionParams {
    cms: HeadlessCms;
    model: CmsModel;
    entryId: string;
}
export const getLatestEntryRevision = async (
    params: GetLatestEntryRevisionParams
): Promise<CmsEntry> => {
    const { cms, model, entryId } = params;
    const [item] = await cms.getLatestEntriesByIds(model, [entryId]);

    if (!item) {
        throw new WebinyError("There is no entry with given ID.", "ENTRY_NOT_FOUND", {
            entryId,
            model: model.modelId
        });
    }
    return item;
};

interface UpdateEntryMetaParams {
    meta: Record<string, any>;
    entryId: string;
    cms: HeadlessCms;
    model: CmsModel;
}
export const updateEntryMeta = async (params: UpdateEntryMetaParams): Promise<void> => {
    const { entryId, cms, model, meta } = params;

    const entry = await getLatestEntryRevision({
        cms,
        model,
        entryId
    });

    await cms.updateEntry(model, entry.id, {}, meta);
};

const isWorkflowApplicable = (entry: CmsEntry, workflow: ApwWorkflow): boolean => {
    const application = workflow.app;
    if (application !== ApwWorkflowApplications.CMS) {
        return false;
    }

    const scopeType = workflow.scope.type;

    if (scopeType === WorkflowScopeTypes.DEFAULT) {
        return true;
    } else if (scopeType === WorkflowScopeTypes.CUSTOM) {
        const models = workflow.scope.data?.models;

        if (Array.isArray(models) && models.includes(entry.modelId)) {
            return true;
        }

        const entries = workflow.scope.data?.entries || [];
        if (Array.isArray(entries) && entries.some(value => value.id === entry.entryId)) {
            return true;
        }
        return false;
    }
    throw new WebinyError(`Unknown scope type "${scopeType}".`, "UNKNOWN_SCOPE_TYPE", {
        workflow
    });
};

interface AssignWorkflowToEntryParams {
    apw: AdvancedPublishingWorkflow;
    entry: CmsEntry;
    model: CmsModel;
}
export const assignWorkflowToEntry = async (params: AssignWorkflowToEntryParams): Promise<void> => {
    const { apw, entry, model } = params;
    /**
     * Lookup and assign "workflowId".
     */
    try {
        /*
         * List all workflows for app cms
         */
        const [entries] = await apw.workflow.list({
            where: {
                app: ApwWorkflowApplications.CMS
            }
        });

        console.log(`Found ${entries.length} workflow(s) for model ${model.modelId}.`);

        /*
         *  Re-order them based on workflow scope and pre-defined rule i.e.
         *  "specific" entry -> entry for a "category" -> "default".
         *  There can be more than one workflow with same "scope" and "app".
         *  Therefore, we are also sorting the workflows by `createdOn` to get the latest workflow.
         */
        const sortedWorkflows = entries
            .sort(workflowByPrecedenceDesc)
            .sort(workflowByCreatedOnDesc);

        /**
         * Assign the first applicable workflow to the page and exit.
         */
        for (const workflow of sortedWorkflows) {
            if (isWorkflowApplicable(entry, workflow) === false) {
                console.log(`Not applying workflow ${workflow.id} to entry ${entry.id}.`);
                continue;
            }
            entry.meta = {
                ...(entry.meta || {}),
                apw: {
                    workflowId: workflow.id,
                    contentReviewId: null
                }
            };
            return;
        }
    } catch (ex) {
        throw new WebinyError(
            `Failed to assign workflow to CMS entry "${entry.id}".`,
            ex.code,
            ex.data
        );
    }
};

export const hasEntries = (workflow: ApwWorkflow): Boolean => {
    const { app, scope } = workflow;
    return (
        app === ApwWorkflowApplications.CMS &&
        scope.type === WorkflowScopeTypes.CUSTOM &&
        scope.data &&
        Array.isArray(scope.data.entries)
    );
};

export const isApwDisabledOnModel = (model: Pick<CmsModel, "modelId" | "isPrivate">): boolean => {
    /**
     * We should not run APW on private models as well.
     */
    if (model.isPrivate) {
        return true;
    }
    return [
        CHANGE_REQUEST_MODEL_ID,
        COMMENT_MODEL_ID,
        CONTENT_REVIEW_MODEL_ID,
        REVIEWER_MODEL_ID,
        WORKFLOW_MODEL_ID
    ].includes(model.modelId);
};
