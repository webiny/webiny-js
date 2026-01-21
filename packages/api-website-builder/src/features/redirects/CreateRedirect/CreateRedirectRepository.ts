import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { CreateRedirectRepository as RepositoryAbstraction } from "./abstractions.js";
import { RedirectModel } from "~/domain/redirect/abstractions.js";
import { RedirectPersistenceError, RedirectValidationError } from "~/domain/redirect/errors.js";
import { EntryToRedirectMapper } from "~/domain/redirect/EntryToRedirectMapper.js";

class CreateRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModel: RedirectModel.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async execute(data: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.createEntry.execute(this.redirectModel, {
            location: data.location,
            values: data
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new RedirectValidationError(result.error.message));
            }
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        const redirect = EntryToRedirectMapper.toRedirect(result.value);
        return Result.ok(redirect);
    }
}

export const CreateRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateRedirectRepositoryImpl,
    dependencies: [RedirectModel, CreateEntryUseCase]
});
