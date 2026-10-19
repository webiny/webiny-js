import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { DeleteEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteAdminExtensionRepository as RepositoryAbstraction } from "./abstractions.js";
import { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import { ADMIN_EXTENSION_MODEL_ID } from "~/api/adminExtensions/domain/constants.js";

class DeleteAdminExtensionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly deleteEntryRepository: DeleteEntryRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(ADMIN_EXTENSION_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new AdminExtensionModelNotFoundError(ADMIN_EXTENSION_MODEL_ID));
            }
            const model = modelResult.value;

            const entryResult = await this.getLatestRevisionRepository.execute(model, { id });
            if (entryResult.isFail()) {
                return Result.fail(new AdminExtensionNotFoundError(id));
            }

            const deleteResult = await this.deleteEntryRepository.execute(model, entryResult.value);
            if (deleteResult.isFail()) {
                return Result.fail(new AdminExtensionPersistenceError(deleteResult.error));
            }

            return Result.ok(true);
        } catch (error) {
            return Result.fail(new AdminExtensionPersistenceError(error));
        }
    }
}

export const DeleteAdminExtensionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteAdminExtensionRepositoryImpl,
    dependencies: [GetModelRepository, GetLatestRevisionByEntryIdRepository, DeleteEntryRepository]
});
