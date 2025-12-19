import { Result } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/index.js";
import { GetPageRevisionsRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PagePersistenceError } from "~/domain/page/errors.js";

class GetPageRevisionsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private getEntryRevisions: GetRevisionsByEntryIdUseCase.Interface
    ) {}

    async execute(entryId: string): Promise<Result<WbPage[], RepositoryAbstraction.Error>> {
        const result = await this.getEntryRevisions.execute(this.pageModel, entryId);

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        const pages = result.value.map(entry => EntryToPageMapper.toPage(entry));
        return Result.ok(pages);
    }
}

export const GetPageRevisionsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPageRevisionsRepositoryImpl,
    dependencies: [PageModel, GetRevisionsByEntryIdUseCase]
});
