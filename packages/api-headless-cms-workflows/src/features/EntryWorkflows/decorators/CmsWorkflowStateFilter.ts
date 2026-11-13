import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/shared-aco/constants.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { WorkflowStateFilter } from "@webiny/api-workflows/features/workflowState/ListWorkflowStates/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { getReadableModel } from "~/utils/readableModel.js";
import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

/**
 * A CMS workflow state is readable by those who can read the model's entries and, with folder
 * level permissions, the content of the entry's folder. Other apps' states go to the decoratee.
 */
class CmsWorkflowStateFilterImpl implements WorkflowStateFilter.Interface {
    constructor(
        private flp: FolderLevelPermissions.Interface,
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private decoratee: WorkflowStateFilter.Interface
    ) {}

    async filter(items: WorkflowState[]): Promise<WorkflowState[]> {
        const cmsItems = items.filter(item => getModelIdFromAppName(item.app) !== null);
        const otherItems = items.filter(item => getModelIdFromAppName(item.app) === null);

        const allowed = new Set<WorkflowState>(
            otherItems.length > 0 ? await this.decoratee.filter(otherItems) : []
        );

        const useFlp = this.flp.canUseFolderLevelPermissions();
        const modelAccess = new Map<string, boolean>();
        const folderAccess = new Map<string, boolean>();

        for (const item of cmsItems) {
            const modelId = getModelIdFromAppName(item.app) as string;
            if (!modelAccess.has(modelId)) {
                const model = await getReadableModel({
                    getModel: this.getModel,
                    accessControl: this.accessControl,
                    modelId
                });
                modelAccess.set(modelId, !!model);
            }
            if (!modelAccess.get(modelId)) {
                continue;
            }
            if (useFlp && !(await this.canReadFolder(item.targetContext?.folderId, folderAccess))) {
                continue;
            }
            allowed.add(item);
        }

        return items.filter(item => allowed.has(item));
    }

    private async canReadFolder(folderId: unknown, cache: Map<string, boolean>): Promise<boolean> {
        // `null` is an entry in the root folder. A missing value means the target could not be
        // read when the state was created: fail closed.
        if (folderId === null || folderId === ROOT_FOLDER) {
            return true;
        }
        if (typeof folderId !== "string" || !folderId) {
            return false;
        }
        const cached = cache.get(folderId);
        if (cached !== undefined) {
            return cached;
        }
        const permissions = await this.flp.getFolderLevelPermissions(folderId);
        const canAccess = await this.flp.canAccessFolderContent({ permissions, rwd: "r" });
        cache.set(folderId, canAccess);
        return canAccess;
    }
}

export const CmsWorkflowStateFilter = WorkflowStateFilter.createDecorator({
    decorator: CmsWorkflowStateFilterImpl,
    dependencies: [FolderLevelPermissions, GetModelUseCase, AccessControl]
});
