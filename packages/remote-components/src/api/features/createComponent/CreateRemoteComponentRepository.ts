import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateRemoteComponentRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError
} from "~/api/domain/errors.js";
import { REMOTE_COMPONENT_MODEL_ID } from "~/shared/constants.js";
import type { RemoteComponentDto } from "~/shared/types.js";
import { mapEntryToDto } from "~/api/features/shared/mapEntryToDto.js";

class CreateRemoteComponentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface
    ) {}

    async execute(
        input: RepositoryAbstraction.Interface extends { execute: (i: infer I) => any } ? I : never
    ): Promise<Result<RemoteComponentDto, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(REMOTE_COMPONENT_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new RemoteComponentNotFoundError(REMOTE_COMPONENT_MODEL_ID));
            }

            const { entry } = await this.createEntryDataFactory.create(modelResult.value, {
                values: {
                    name: input.name,
                    label: input.label,
                    description: input.description ?? "",
                    aiContext: input.aiContext ?? "",
                    source: input.source,
                    css: input.css ?? "",
                    bundledJs: "",
                    bundledJsSha256: "",
                    bundledCss: "",
                    bundledCssSha256: "",
                    aiPrompt: input.aiPrompt ?? "",
                    status: input.status ?? "draft",
                    sdkVersion: "1"
                }
            });

            const createResult = await this.createEntryRepository.execute(modelResult.value, entry);

            if (createResult.isFail()) {
                return Result.fail(new RemoteComponentPersistenceError(createResult.error));
            }

            return Result.ok(mapEntryToDto(entry));
        } catch (error) {
            return Result.fail(new RemoteComponentPersistenceError(error as Error));
        }
    }
}

export const CreateRemoteComponentRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateRemoteComponentRepositoryImpl,
    dependencies: [GetModelRepository, CreateEntryRepository, CreateEntryDataFactory]
});
