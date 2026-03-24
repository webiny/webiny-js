import { Result } from "@webiny/feature/api";
import { GetDeletedPageByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundTrashedError, PagePersistenceError } from "~/domain/page/errors.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";

class GetDeletedPageByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface
    ) {}

    public async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.getLatestRevision.execute(this.pageModel, {
            id
        });

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        const entry = result.value;
        if (!entry?.wbyDeleted) {
            return Result.fail(new PageNotFoundTrashedError(id));
        }

        const page = EntryToPageMapper.toPage(entry);
        return Result.ok(page);
    }
}

export const GetDeletedPageByIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetDeletedPageByIdRepositoryImpl,
    dependencies: [PageModel, GetLatestRevisionByEntryIdIncludingDeletedUseCase]
});
