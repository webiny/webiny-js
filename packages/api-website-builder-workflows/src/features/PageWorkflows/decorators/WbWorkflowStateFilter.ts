import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/shared-aco/constants.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { WorkflowStateFilter } from "@webiny/api-workflows/features/workflowState/ListWorkflowStates/index.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import type { WorkflowState } from "@webiny/api-workflows/domain/workflowState/WorkflowState.js";

/**
 * A page workflow state is readable by those who can read pages and, with folder level
 * permissions, the content of the page's folder. Other apps' states go to the decoratee.
 */
class WbWorkflowStateFilterImpl implements WorkflowStateFilter.Interface {
    constructor(
        private flp: FolderLevelPermissions.Interface,
        private permissions: WbPermissions.Interface,
        private decoratee: WorkflowStateFilter.Interface
    ) {}

    async filter(items: WorkflowState[]): Promise<WorkflowState[]> {
        const wbItems = items.filter(item => item.app === WB_PAGE_APP);
        const otherItems = items.filter(item => item.app !== WB_PAGE_APP);

        const allowed = new Set<WorkflowState>(
            otherItems.length > 0 ? await this.decoratee.filter(otherItems) : []
        );

        if (wbItems.length > 0 && (await this.permissions.canRead("page"))) {
            const useFlp = this.flp.canUseFolderLevelPermissions();
            const folderAccess = new Map<string, boolean>();
            for (const item of wbItems) {
                if (
                    useFlp &&
                    !(await this.canReadFolder(item.targetContext?.folderId, folderAccess))
                ) {
                    continue;
                }
                allowed.add(item);
            }
        }

        return items.filter(item => allowed.has(item));
    }

    private async canReadFolder(folderId: unknown, cache: Map<string, boolean>): Promise<boolean> {
        // `null` is a page in the root folder. A missing value means the target could not be
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

export const WbWorkflowStateFilter = WorkflowStateFilter.createDecorator({
    decorator: WbWorkflowStateFilterImpl,
    dependencies: [FolderLevelPermissions, WbPermissions]
});
