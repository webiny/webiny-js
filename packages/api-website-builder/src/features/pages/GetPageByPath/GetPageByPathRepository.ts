import { Result } from "@webiny/feature/api";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { GetPageByPathRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbPage, PageModelProvider } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class GetPageByPathRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModelProvider: PageModelProvider.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async execute(path: string): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        const result = await this.getEntry.execute<CmsEntryWbPage>(pageModel, {
            where: {
                values: {
                    properties: {
                        path
                    }
                },
                published: true
            },
            /*
             * A path is meant to identify one page, and with one published match the sort changes
             * nothing. It matters when there is more than one, which a project reaches by publishing
             * a second page at an existing path — nothing prevents that, and this query used to
             * answer with whichever the store returned first. Two requests could then serve two
             * different pages with no change in between, which reads as data corruption rather than
             * as a duplicate path.
             *
             * Most recently published wins. It is the answer an author expects from "I published
             * this over the top of that", and unlike creation order it follows the act that made the
             * page live.
             */
            sort: ["lastPublishedOn_DESC"]
        });

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        if (!result.value) {
            return Result.fail(new PageNotFoundError(path));
        }

        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const GetPageByPathRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPageByPathRepositoryImpl,
    dependencies: [PageModelProvider, GetEntryUseCase]
});
