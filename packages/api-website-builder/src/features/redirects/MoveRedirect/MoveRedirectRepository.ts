import { Result } from "@webiny/feature/api";
import { MoveRedirectRepository as RepositoryAbstraction } from "./abstractions.js";
import { RedirectModel, type WbRedirect } from "~/domain/redirect/abstractions.js";
import { RedirectPersistenceError } from "~/domain/redirect/errors.js";
import { MoveEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { GetRedirectByIdRepository } from "~/features/redirects/GetRedirectById/abstractions.js";

class MoveRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModel: RedirectModel.Interface,
        private moveEntry: MoveEntryRepository.Interface,
        private getRedirectById: GetRedirectByIdRepository.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, validate the redirect exists
        const getResult = await this.getRedirectById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        // Update the redirect location with the new folderId
        const result = await this.moveEntry.execute(this.redirectModel, params.id, params.folderId);

        if (result.isFail()) {
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        const movedRedirect: WbRedirect = {
            ...getResult.value,
            location: {
                folderId: params.folderId
            }
        };
        return Result.ok(movedRedirect);
    }
}

export const MoveRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: MoveRedirectRepositoryImpl,
    dependencies: [RedirectModel, MoveEntryRepository, GetRedirectByIdRepository]
});
