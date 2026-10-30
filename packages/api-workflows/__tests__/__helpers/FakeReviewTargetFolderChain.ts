import { ReviewTargetFolderChain } from "~/features/review/ReviewTargetFolderChain/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

/** Folder id to its chain (the folder, then ancestors). Unknown folders are their own chain. */
export const folderChains = new Map<string, string[]>();

/** Every chain request, in order. Reset per test. */
export const folderChainCalls: ReviewTargetFolderChain.Params[] = [];

export interface FolderChainFaults {
    throwNext: boolean;
}

export const folderChainFaults: FolderChainFaults = { throwNext: false };

class FakeReviewTargetFolderChainImpl implements ReviewTargetFolderChain.Interface {
    public canHandle(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]> {
        folderChainCalls.push({ ...params });
        if (folderChainFaults.throwNext) {
            folderChainFaults.throwNext = false;
            throw new Error("The folder read crashed.");
        }
        return [...(folderChains.get(params.folderId) ?? [params.folderId])];
    }
}

export const FakeReviewTargetFolderChain = ReviewTargetFolderChain.createImplementation({
    implementation: FakeReviewTargetFolderChainImpl,
    dependencies: []
});
