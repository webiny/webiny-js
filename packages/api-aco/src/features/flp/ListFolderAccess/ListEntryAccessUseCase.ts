import { Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import {
    ListEntryAccessUseCase as UseCaseAbstraction,
    ListFolderAccessUseCase
} from "./abstractions.js";

class ListEntryAccessUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private listFolderAccess: ListFolderAccessUseCase.Interface
    ) {}

    async execute(model: CmsModel, entryId: string): UseCaseAbstraction.Return {
        const result = await this.getLatestRevision.execute(model, { id: entryId });
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        const entry = result.value;
        const folderId = entry.location?.folderId ?? null;
        return this.listFolderAccess.execute(folderId);
    }
}

export const ListEntryAccessUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListEntryAccessUseCaseImpl,
    dependencies: [GetLatestRevisionByEntryIdUseCase, ListFolderAccessUseCase]
});
