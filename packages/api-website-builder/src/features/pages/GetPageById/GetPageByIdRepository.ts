import { Result } from "@webiny/feature/api";
import { GetPageByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";

class GetPageByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.getEntryById.execute(this.pageModel, id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(id));
            }

            return Result.fail(new PagePersistenceError(result.error));
        }

        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const GetPageByIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPageByIdRepositoryImpl,
    dependencies: [PageModel, GetEntryByIdUseCase]
});
