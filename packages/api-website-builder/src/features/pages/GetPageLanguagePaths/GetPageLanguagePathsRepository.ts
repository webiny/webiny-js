import { Result } from "@webiny/feature/api";
import { ListPublishedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { GetPageLanguagePathsRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbPage, PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PagePersistenceError } from "~/domain/page/errors.js";

class GetPageLanguagePathsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private listPublished: ListPublishedEntriesUseCase.Interface
    ) {}

    async execute(rootEntryId: string): RepositoryAbstraction.Return {
        const result = await this.listPublished.execute<CmsEntryWbPage>(this.pageModel, {
            where: {
                values: {
                    properties: { sourcePage: rootEntryId }
                }
            }
        });

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        const languagePaths: Record<string, string> = {};
        for (const entry of result.value.entries) {
            const page = EntryToPageMapper.toPage(entry);
            if (page.properties?.language && page.properties?.path) {
                languagePaths[page.properties.language] = page.properties.path;
            }
        }

        return Result.ok(languagePaths);
    }
}

export const GetPageLanguagePathsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPageLanguagePathsRepositoryImpl,
    dependencies: [PageModel, ListPublishedEntriesUseCase]
});
