import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { SetAdminExtensionEnabledRepository as RepositoryAbstraction } from "./abstractions.js";
import type { ISetAdminExtensionEnabledInput } from "./abstractions.js";
import { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import { ADMIN_EXTENSION_MODEL_ID } from "~/api/adminExtensions/domain/constants.js";
import { mapEntryToAdminExtension } from "~/api/adminExtensions/domain/mapEntryToAdminExtension.js";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionValues } from "~/api/adminExtensions/domain/AdminExtension.js";

class SetAdminExtensionEnabledRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly updateEntryDataFactory: UpdateEntryDataFactory.Interface,
        private readonly updateEntryRepository: UpdateEntryRepository.Interface
    ) {}

    async execute(
        input: ISetAdminExtensionEnabledInput
    ): Promise<Result<AdminExtension, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(ADMIN_EXTENSION_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new AdminExtensionModelNotFoundError(ADMIN_EXTENSION_MODEL_ID));
            }
            const model = modelResult.value;

            const entryResult =
                await this.getLatestRevisionRepository.execute<AdminExtensionValues>(model, {
                    id: input.id
                });
            if (entryResult.isFail()) {
                return Result.fail(new AdminExtensionNotFoundError(input.id));
            }
            const original = entryResult.value;

            const values: AdminExtensionValues = { ...original.values, enabled: input.enabled };

            const dataResult = await this.updateEntryDataFactory.create(
                model,
                { values },
                original
            );
            if (dataResult.isFail()) {
                return Result.fail(new AdminExtensionPersistenceError(dataResult.error));
            }
            const { entry } = dataResult.value;

            const updateResult = await this.updateEntryRepository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(new AdminExtensionPersistenceError(updateResult.error));
            }

            return Result.ok(mapEntryToAdminExtension(entry));
        } catch (error) {
            return Result.fail(new AdminExtensionPersistenceError(error));
        }
    }
}

export const SetAdminExtensionEnabledRepository = RepositoryAbstraction.createImplementation({
    implementation: SetAdminExtensionEnabledRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        UpdateEntryDataFactory,
        UpdateEntryRepository
    ]
});
