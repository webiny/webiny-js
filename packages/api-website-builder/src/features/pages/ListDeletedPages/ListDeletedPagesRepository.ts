import { Result } from "@webiny/feature/api";
import { ListDeletedPagesRepository as RepositoryAbstraction } from "./abstractions.js";
import { ListDeletedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PagePersistenceError } from "~/domain/page/errors.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import { CmsSortMapper } from "@webiny/api-headless-cms/features/sortMapper/abstractions.js";

class ListDeletedPagesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private listDeletedEntries: ListDeletedEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface,
        private sortMapper: CmsSortMapper.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.listDeletedEntries.execute(this.pageModel, {
            where: this.whereMapper.map({
                fields: this.pageModel.fields,
                input: params.where
            }),
            sort: this.sortMapper.map({
                fields: this.pageModel.fields,
                input: params.sort
            }),
            limit: params.limit,
            after: params.after,
            search: params.search
        });

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        const { entries, meta } = result.value;
        const pages = entries.map(entry => EntryToPageMapper.toPage(entry));

        return Result.ok({ pages, meta });
    }
}

export const ListDeletedPagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListDeletedPagesRepositoryImpl,
    dependencies: [PageModel, ListDeletedEntriesUseCase, CmsWhereMapper, CmsSortMapper]
});
