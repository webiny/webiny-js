import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/index.js";
import { WB_PAGE_FOLDER_TYPE, WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * The folder of a `wb.page` target and its ancestors, nearest first, for the routing rules'
 * folder condition (spec 6, R113, R114). Read through ACO's repository, which applies no
 * folder-level permissions (the folder model is private with `authorization: false`): routing
 * matches the folder tree, not what the requester may see. Read at step reach, so a moved parent
 * counts. A missing folder, a folder of another type and a failed read throw; the engine falls
 * through to the pool (R116).
 */
class WbPageReviewTargetFolderChainImpl implements ReviewTargetFolderChain.Interface {
    public constructor(
        private getFolder: GetFolderRepository.Interface,
        private getAncestors: GetAncestorsUseCase.Interface
    ) {}

    public canHandle(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]> {
        // Folder ids are plain entry ids; the repository would read `<id>#<n>` as a revision.
        if (!params.folderId || params.folderId.includes("#")) {
            throw new Error(`"${params.folderId}" is not a valid folder id.`);
        }

        const folder = await this.getFolder.execute(params.folderId);
        if (folder.isFail()) {
            throw folder.error;
        }
        if (folder.value.type !== WB_PAGE_FOLDER_TYPE) {
            throw new Error(`Folder "${params.folderId}" is not a Website Builder page folder.`);
        }

        // The folder itself first, then its parents up to the root level.
        const ancestors = await this.getAncestors.execute({ folder: folder.value });
        if (ancestors.isFail()) {
            throw ancestors.error;
        }
        return ancestors.value.map(item => item.id);
    }
}

export const WbPageReviewTargetFolderChain = ReviewTargetFolderChain.createImplementation({
    implementation: WbPageReviewTargetFolderChainImpl,
    dependencies: [GetFolderRepository, GetAncestorsUseCase]
});
