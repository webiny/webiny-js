import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";
import { toCmsFolderType } from "~/utils/folderType.js";

/**
 * The folder of a `cms.<modelId>` target and its ancestors, nearest first, for the routing rules'
 * folder condition (spec 6, R113, R114). Read through ACO's repository, which applies no
 * folder-level permissions (the folder model is private with `authorization: false`): routing
 * matches the folder tree, not what the requester may see. Read at step reach, so a moved parent
 * counts. A missing folder, a folder of another type and a failed read throw; the engine falls
 * through to the pool (R116).
 */
class CmsEntryReviewTargetFolderChainImpl implements ReviewTargetFolderChain.Interface {
    public constructor(
        private getFolder: GetFolderRepository.Interface,
        private getAncestors: GetAncestorsUseCase.Interface
    ) {}

    public canHandle(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]> {
        const modelId = getModelIdFromAppName(params.model);
        if (!modelId) {
            throw new Error(`"${params.model}" is not a CMS namespace.`);
        }

        if (!params.folderId || params.folderId.includes("#")) {
            throw new Error(`"${params.folderId}" is not a valid folder id.`);
        }

        const folder = await this.getFolder.execute(params.folderId);
        if (folder.isFail()) {
            throw folder.error;
        }
        if (folder.value.type !== toCmsFolderType(modelId)) {
            throw new Error(`Folder "${params.folderId}" is not a folder of "${params.model}".`);
        }

        const ancestors = await this.getAncestors.execute({ folder: folder.value });
        if (ancestors.isFail()) {
            throw ancestors.error;
        }
        return ancestors.value.map(item => item.id);
    }
}

export const CmsEntryReviewTargetFolderChain = ReviewTargetFolderChain.createImplementation({
    implementation: CmsEntryReviewTargetFolderChainImpl,
    dependencies: [GetFolderRepository, GetAncestorsUseCase]
});
