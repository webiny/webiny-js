import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { MoveRedirectRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbRedirect, RedirectModel } from "~/domain/redirect/abstractions.js";
import { RedirectNotFoundError, RedirectPersistenceError } from "~/domain/redirect/errors.js";
import { EntryToRedirectMapper } from "~/domain/redirect/EntryToRedirectMapper.js";

class MoveRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModel: RedirectModel.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, validate the redirect exists
        const getResult = await this.getEntryById.execute<CmsEntryWbRedirect>(
            this.redirectModel,
            params.id
        );

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new RedirectNotFoundError(params.id));
            }
            return Result.fail(new RedirectPersistenceError(getResult.error));
        }

        // Update the redirect location with the new folderId
        const result = await this.updateEntry.execute<CmsEntryWbRedirect>(
            this.redirectModel,
            params.id,
            {
                location: {
                    folderId: params.folderId
                }
            }
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new RedirectNotFoundError(params.id));
            }
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        const redirect = EntryToRedirectMapper.toRedirect(result.value);
        return Result.ok(redirect);
    }
}

export const MoveRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: MoveRedirectRepositoryImpl,
    dependencies: [RedirectModel, UpdateEntryUseCase, GetEntryByIdUseCase]
});
