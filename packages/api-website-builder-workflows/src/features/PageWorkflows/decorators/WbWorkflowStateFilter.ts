import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/shared-aco/constants.js";
import { WorkflowStateFilter } from "@webiny/api-workflows/features/workflowState/ListWorkflowStates/index.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

class WbWorkflowStateFilterImpl implements WorkflowStateFilter.Interface {
    constructor(
        private flp: FolderLevelPermissions.Interface,
        private decoratee: WorkflowStateFilter.Interface
    ) {}

    async filter(items: WorkflowState[]): Promise<WorkflowState[]> {
        const filtered = await this.decoratee.filter(items);

        if (!this.flp.canUseFolderLevelPermissions()) {
            return filtered;
        }

        const wbItems = filtered.filter(item => item.app === WB_PAGE_APP);
        if (wbItems.length === 0) {
            return filtered;
        }

        const folderIds = new Set<string>();
        for (const item of wbItems) {
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
            if (item.app !== WB_PAGE_APP) {
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

export const WbWorkflowStateFilter = WorkflowStateFilter.createDecorator({
    decorator: WbWorkflowStateFilterImpl,
    dependencies: [FolderLevelPermissions]
});
