import { Result } from "@webiny/feature/api";
import { GetDeletedPageByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { GetRevisionByIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";

class GetDeletedPageByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModel: PageModel.Interface,
        private getEntryById: GetRevisionByIdRepository.Interface
    ) {}

    public async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.getEntryById.execute(this.pageModel, id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(id));
            }

            return Result.fail(new PagePersistenceError(result.error));
        } else if (!result.value.wbyDeleted) {
            return Result.fail(new PageNotFoundError(id));
        }

        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const GetDeletedPageByIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetDeletedPageByIdRepositoryImpl,
    dependencies: [PageModel, GetRevisionByIdRepository]
});
