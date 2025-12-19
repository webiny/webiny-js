import { Result } from "@webiny/feature/api";
import {
    ListPagesRepository as RepositoryAbstraction,
    type ListPagesResult
} from "./abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { PageModel } from "~/domain/page/abstractions.js";
import type { ListPagesParams } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PagePersistenceError } from "~/domain/page/errors.js";

class ListPagesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(
        params: ListPagesParams
    ): Promise<Result<ListPagesResult, RepositoryAbstraction.Error>> {
        const result = await this.listLatestEntries.execute(this.pageModel, {
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after,
            search: params.search
        });

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        const [entries, meta] = result.value;
        const pages = entries.map(entry => EntryToPageMapper.toPage(entry));

        return Result.ok([pages, meta]);
    }
}

export const ListPagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListPagesRepositoryImpl,
    dependencies: [PageModel, ListLatestEntriesUseCase]
});
