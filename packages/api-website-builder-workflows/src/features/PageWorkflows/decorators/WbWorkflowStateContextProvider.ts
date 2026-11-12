import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/shared-aco/constants.js";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/features/pages/GetPageById/index.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { WorkflowStateContextProvider } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/index.js";
import { WorkflowStateNotAuthorizedError } from "@webiny/api-workflows/domain/workflowState/errors.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Starting a review on a page requires write access to it, checked with the caller's rights.
 * Fails closed: a page that can't be read refuses the request.
 */
class WbWorkflowStateContextProviderImpl implements WorkflowStateContextProvider.Interface {
    constructor(
        private getPageById: GetPageByIdUseCase.Interface,
        private permissions: WbPermissions.Interface,
        private flp: FolderLevelPermissions.Interface,
        private decoratee: WorkflowStateContextProvider.Interface
    ) {}

    async provide(params: WorkflowStateContextProvider.Params): Promise<GenericRecord> {
        if (params.app !== WB_PAGE_APP) {
            return this.decoratee.provide(params);
        }

        const notAuthorized = new WorkflowStateNotAuthorizedError(
            "You cannot request a review of this page."
        );

        const pageResult = await this.getPageById.execute(params.targetRevisionId);
        if (pageResult.isFail()) {
            throw notAuthorized;
        }

        const page = pageResult.value;

        if (!(await this.permissions.canEdit("page", page))) {
            throw notAuthorized;
        }

        const folderId = page.location?.folderId || null;
        if (folderId && folderId !== ROOT_FOLDER && this.flp.canUseFolderLevelPermissions()) {
            const permissions = await this.flp.getFolderLevelPermissions(folderId);
            const canWrite = await this.flp.canAccessFolderContent({ permissions, rwd: "w" });
            if (!canWrite) {
                throw notAuthorized;
            }
        }

        return {
            folderId
        };
    }
}

export const WbWorkflowStateContextProvider = WorkflowStateContextProvider.createDecorator({
    decorator: WbWorkflowStateContextProviderImpl,
    dependencies: [GetPageByIdUseCase, WbPermissions, FolderLevelPermissions]
});
