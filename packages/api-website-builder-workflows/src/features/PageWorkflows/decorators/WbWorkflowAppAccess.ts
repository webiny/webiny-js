import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { WorkflowAppAccess } from "@webiny/api-workflows/features/workflow/WorkflowAppAccess/index.js";
import { WB_PAGE_APP } from "~/utils/appName.js";

/**
 * The `wb.page` workflow is readable by those who can read pages.
 */
class WbWorkflowAppAccessImpl implements WorkflowAppAccess.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private decoratee: WorkflowAppAccess.Interface
    ) {}

    async canRead(app: string): Promise<boolean> {
        if (app !== WB_PAGE_APP) {
            return this.decoratee.canRead(app);
        }
        return this.permissions.canRead("page");
    }
}

export const WbWorkflowAppAccess = WorkflowAppAccess.createDecorator({
    decorator: WbWorkflowAppAccessImpl,
    dependencies: [WbPermissions]
});
