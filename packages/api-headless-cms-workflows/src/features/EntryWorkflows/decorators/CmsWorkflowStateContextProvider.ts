import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/shared-aco/constants.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { WorkflowStateContextProvider } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/index.js";
import { WorkflowStateNotAuthorizedError } from "@webiny/api-workflows/domain/workflowState/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Starting a review on an entry requires write access to it, checked with the caller's rights.
 * Fails closed: an entry that can't be read refuses the request.
 */
class CmsWorkflowStateContextProviderImpl implements WorkflowStateContextProvider.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private flp: FolderLevelPermissions.Interface,
        private decoratee: WorkflowStateContextProvider.Interface
    ) {}

    async provide(params: WorkflowStateContextProvider.Params): Promise<GenericRecord> {
        const modelId = getModelIdFromAppName(params.app);
        if (!modelId) {
            return this.decoratee.provide(params);
        }

        const notAuthorized = new WorkflowStateNotAuthorizedError(
            "You cannot request a review of this entry."
        );

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            throw notAuthorized;
        }

        const model = modelResult.value;
        const entryResult = await this.getRevisionById.execute(model, params.targetRevisionId);
        if (entryResult.isFail()) {
            throw notAuthorized;
        }

        const entry = entryResult.value;

        if (!(await this.accessControl.canAccessEntry({ model, entry, rwd: "w" }))) {
            throw notAuthorized;
        }

        const folderId = entry.location?.folderId || null;
        if (folderId && folderId !== ROOT_FOLDER && this.flp.canUseFolderLevelPermissions()) {
            const permissions = await this.flp.getFolderLevelPermissions(folderId);
            const canWrite = await this.flp.canAccessFolderContent({ permissions, rwd: "w" });
            if (!canWrite) {
                throw notAuthorized;
            }
        }

        return {
            folderId,
            modelId
        };
    }
}

export const CmsWorkflowStateContextProvider = WorkflowStateContextProvider.createDecorator({
    decorator: CmsWorkflowStateContextProviderImpl,
    dependencies: [GetModelUseCase, GetRevisionByIdUseCase, AccessControl, FolderLevelPermissions]
});
