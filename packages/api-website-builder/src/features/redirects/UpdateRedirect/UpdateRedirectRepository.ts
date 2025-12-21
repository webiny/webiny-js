import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateRedirectRepository as RepositoryAbstraction } from "./abstractions.js";
import { RedirectModel } from "~/domain/redirect/abstractions.js";
import {
    RedirectValidationError,
    RedirectNotFoundError,
    RedirectPersistenceError
} from "~/domain/redirect/errors.js";
import { EntryToRedirectMapper } from "~/domain/redirect/EntryToRedirectMapper.js";

class UpdateRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModel: RedirectModel.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(
        id: string,
        data: RepositoryAbstraction.UpdateData
    ): RepositoryAbstraction.Return {
        // First, validate the redirect exists
        const getResult = await this.getEntryById.execute(this.redirectModel, id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new RedirectNotFoundError(id));
            }
            return Result.fail(new RedirectPersistenceError(getResult.error));
        }

        // Update the entry
        const result = await this.updateEntry.execute(this.redirectModel, id, data);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new RedirectValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new RedirectNotFoundError(id));
            }
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        const redirect = EntryToRedirectMapper.toRedirect(result.value);
        return Result.ok(redirect);
    }
}

export const UpdateRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateRedirectRepositoryImpl,
    dependencies: [RedirectModel, UpdateEntryUseCase, GetEntryByIdUseCase]
});
