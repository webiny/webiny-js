import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetExperimentByIdRepository as RepositoryAbstraction } from "./abstractions/GetExperimentByIdRepository.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentNotFoundError, ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class GetExperimentByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private experimentModel: ExperimentModel.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.getEntryById.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
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
    dependencies: [ExperimentModel, GetEntryByIdUseCase]
});
