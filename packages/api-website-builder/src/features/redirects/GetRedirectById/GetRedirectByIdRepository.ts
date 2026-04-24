import { Result } from "@webiny/feature/api";
import { GetRedirectByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { type CmsEntryWbRedirect, RedirectModel } from "~/domain/redirect/abstractions.js";
import { RedirectNotFoundError, RedirectPersistenceError } from "~/domain/redirect/errors.js";
import { EntryToRedirectMapper } from "~/domain/redirect/EntryToRedirectMapper.js";

class GetRedirectByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModel: RedirectModel.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.getEntryById.execute<CmsEntryWbRedirect>(this.redirectModel, id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new RedirectNotFoundError(id));
            }

            return Result.fail(new RedirectPersistenceError(result.error));
        }

        const redirect = EntryToRedirectMapper.toRedirect(result.value);
        return Result.ok(redirect);
    }
}

export const GetRedirectByIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetRedirectByIdRepositoryImpl,
    dependencies: [RedirectModel, GetEntryByIdUseCase]
});
