import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetExperimentByIdRepository as RepositoryAbstraction } from "./abstractions/GetExperimentByIdRepository.js";
import { ExperimentModelProvider } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentNotFoundError, ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class GetExperimentByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private experimentModelProvider: ExperimentModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const experimentModel = await this.experimentModelProvider.get();
        const result = await this.getEntryById.execute<CmsEntryWbExperimentValues>(
            experimentModel,
            id
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ExperimentNotFoundError(id));
            }
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        return Result.ok(EntryToExperimentMapper.toExperiment(result.value));
    }
}

export const GetExperimentByIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetExperimentByIdRepositoryImpl,
    dependencies: [ExperimentModelProvider, GetEntryByIdUseCase]
});
