import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/shared-aco/constants.js";
import { WorkflowStateFilter } from "@webiny/api-workflows/features/workflowState/ListWorkflowStates/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

class CmsWorkflowStateFilterImpl implements WorkflowStateFilter.Interface {
    constructor(
        private flp: FolderLevelPermissions.Interface,
        private decoratee: WorkflowStateFilter.Interface
    ) {}

    async filter(items: WorkflowState[]): Promise<WorkflowState[]> {
        const filtered = await this.decoratee.filter(items);

        if (!this.flp.canUseFolderLevelPermissions()) {
            return filtered;
        }

        const cmsItems = filtered.filter(item => getModelIdFromAppName(item.app) !== null);
        if (cmsItems.length === 0) {
            return filtered;
        }

        const folderIds = new Set<string>();
        for (const item of cmsItems) {
            const folderId = item.targetContext?.folderId;
            if (folderId && folderId !== ROOT_FOLDER) {
                folderIds.add(folderId);
            }
        }

        const folderAccess = new Map<string, boolean>();

        for (const folderId of folderIds) {
            const permissions = await this.flp.getFolderLevelPermissions(folderId);
            const canAccess = await this.flp.canAccessFolderContent({
                permissions,
                rwd: "r"
            });
            folderAccess.set(folderId, canAccess);
        }

        return filtered.filter(item => {
            if (getModelIdFromAppName(item.app) === null) {
                return true;
            }

            const folderId = item.targetContext?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return true;
            }

            return folderAccess.get(folderId) === true;
        });
    }
}

export const CmsWorkflowStateFilter = WorkflowStateFilter.createDecorator({
    decorator: CmsWorkflowStateFilterImpl,
    dependencies: [FolderLevelPermissions]
});
