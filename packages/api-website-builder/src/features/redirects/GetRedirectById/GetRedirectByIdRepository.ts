import { Result } from "@webiny/feature/api";
import { GetRedirectByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { type CmsEntryWbRedirect, RedirectModelProvider } from "~/domain/redirect/abstractions.js";
import { RedirectNotFoundError, RedirectPersistenceError } from "~/domain/redirect/errors.js";
import { EntryToRedirectMapper } from "~/domain/redirect/EntryToRedirectMapper.js";

class GetRedirectByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModelProvider: RedirectModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const redirectModel = await this.redirectModelProvider.get();
        const result = await this.getEntryById.execute<CmsEntryWbRedirect>(redirectModel, id);

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
    dependencies: [RedirectModelProvider, GetEntryByIdUseCase]
});
