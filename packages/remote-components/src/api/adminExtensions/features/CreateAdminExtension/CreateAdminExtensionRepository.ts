import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateAdminExtensionRepository as RepositoryAbstraction } from "./abstractions.js";
import { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import { ADMIN_EXTENSION_MODEL_ID } from "~/api/adminExtensions/domain/constants.js";
import { mapEntryToAdminExtension } from "~/api/adminExtensions/domain/mapEntryToAdminExtension.js";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionValues } from "~/api/adminExtensions/domain/AdminExtension.js";

class CreateAdminExtensionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface
    ) {}

    async execute(
        values: AdminExtensionValues
    ): Promise<Result<AdminExtension, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(ADMIN_EXTENSION_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new AdminExtensionModelNotFoundError(ADMIN_EXTENSION_MODEL_ID));
            }

            const { entry } = await this.createEntryDataFactory.create<AdminExtensionValues>(
                modelResult.value,
                { values }
            );

            const createResult = await this.createEntryRepository.execute(modelResult.value, entry);
            if (createResult.isFail()) {
                return Result.fail(new AdminExtensionPersistenceError(createResult.error));
            }

            return Result.ok(mapEntryToAdminExtension(entry));
        } catch (error) {
            return Result.fail(new AdminExtensionPersistenceError(error));
        }
    }
}

export const CreateAdminExtensionRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateAdminExtensionRepositoryImpl,
    dependencies: [GetModelRepository, CreateEntryRepository, CreateEntryDataFactory]
});
