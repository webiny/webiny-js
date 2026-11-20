import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { getModelIdFromAppName } from "~/utils/appName.js";

export interface ICanReadCmsWorkflowParams {
    permissions: WorkflowsPermissions.Interface;
    getModel: GetModelUseCase.Interface;
    accessControl: AccessControl.Interface;
}

/**
 * Security: a Headless CMS workflow is readable by workflow editors and by those who can read the
 * entries of at least one model it is bound to. Model access is evaluated once per model id.
 */
export const createCmsWorkflowReadCheck = (params: ICanReadCmsWorkflowParams) => {
    const { permissions, getModel, accessControl } = params;
    let canEdit: Promise<boolean> | undefined;
    const modelAccess = new Map<string, Promise<boolean>>();

    const canReadModelEntries = (modelId: string): Promise<boolean> => {
        let access = modelAccess.get(modelId);
        if (!access) {
            access = (async () => {
                const model = await getModel.execute(modelId);
                if (model.isFail()) {
                    return false;
                }
                return accessControl.canAccessEntry({ model: model.value, rwd: "r" });
            })();
            modelAccess.set(modelId, access);
        }
        return access;
    };

    return async (workflow: WorkflowValues): Promise<boolean> => {
        canEdit = canEdit ?? permissions.canEdit();
        if (await canEdit) {
            return true;
        }
        const modelIds = workflow.models
            .map(namespace => getModelIdFromAppName(namespace))
            .filter((modelId): modelId is string => !!modelId);
        const access = await Promise.all(modelIds.map(canReadModelEntries));
        return access.some(Boolean);
    };
};
