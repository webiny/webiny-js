import { Result } from "@webiny/feature/api";
import { ListPublishedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { GetPageLanguagePathsRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbPage, PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PagePersistenceError } from "~/domain/page/errors.js";

class GetPageLanguagePathsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private listPublished: ListPublishedEntriesUseCase.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async execute(rootEntryId: string): RepositoryAbstraction.Return {
        const [sourceResult, translationsResult] = await Promise.all([
            // Fetch the source page itself.
            this.getEntry.execute<CmsEntryWbPage>(this.pageModel, {
                where: { entryId: rootEntryId, published: true }
            }),
            // Fetch all translated pages pointing to the source.
            this.listPublished.execute<CmsEntryWbPage>(this.pageModel, {
                where: {
                    values: {
                        properties: { sourcePage: rootEntryId }
                    }
                }
            })
        ]);

        if (translationsResult.isFail()) {
            return Result.fail(new PagePersistenceError(translationsResult.error));
        }

        const languagePaths: Record<string, string> = {};

        // Include the source page.
        if (!sourceResult.isFail() && sourceResult.value) {
            const source = EntryToPageMapper.toPage(sourceResult.value);
            if (source.properties?.language && source.properties?.path) {
                languagePaths[source.properties.language] = source.properties.path;
            }
        }

        // Include all translations.
        for (const entry of translationsResult.value.entries) {
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
    dependencies: [PageModel, ListPublishedEntriesUseCase, GetEntryUseCase]
});
