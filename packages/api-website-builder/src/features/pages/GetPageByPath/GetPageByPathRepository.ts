import { Result } from "@webiny/feature/api";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { GetPageByPathRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbPage, PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class GetPageByPathRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async execute(path: string): RepositoryAbstraction.Return {
        const result = await this.getEntry.execute<CmsEntryWbPage>(this.pageModel, {
            where: {
                values: {
                    properties: {
                        path
                    }
                },
                published: true
            }
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
    dependencies: [PageModel, GetEntryUseCase]
});
