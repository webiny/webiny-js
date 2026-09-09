import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { DeleteRedirectRepository as RepositoryAbstraction } from "./abstractions.js";
import { RedirectModelProvider } from "~/domain/redirect/abstractions.js";
import { RedirectNotFoundError, RedirectPersistenceError } from "~/domain/redirect/errors.js";

class DeleteRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModelProvider: RedirectModelProvider.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const redirectModel = await this.redirectModelProvider.get();
        const result = await this.deleteEntry.execute(redirectModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new RedirectNotFoundError(params.id));
            }
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeleteRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteRedirectRepositoryImpl,
    dependencies: [RedirectModelProvider, DeleteEntryUseCase]
});
