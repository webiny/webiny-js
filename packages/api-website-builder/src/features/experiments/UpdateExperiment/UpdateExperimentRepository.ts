import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateExperimentRepository as RepositoryAbstraction } from "./abstractions/UpdateExperimentRepository.js";
import { ExperimentModelProvider } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import {
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

class UpdateExperimentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private experimentModelProvider: ExperimentModelProvider.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const experimentModel = await this.experimentModelProvider.get();
        const getResult = await this.getEntryById.execute(experimentModel, params.id);
        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ExperimentNotFoundError(params.id));
            }
            return Result.fail(new ExperimentPersistenceError(getResult.error));
        }

        const result = await this.updateEntry.execute<CmsEntryWbExperimentValues>(
            experimentModel,
            params.id,
            { values: params.data as Partial<CmsEntryWbExperimentValues> }
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new ExperimentValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ExperimentNotFoundError(params.id));
            }
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        return Result.ok(EntryToExperimentMapper.toExperiment(result.value));
    }
}

export const UpdateExperimentRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateExperimentRepositoryImpl,
    dependencies: [UpdateEntryUseCase, GetEntryByIdUseCase, ExperimentModelProvider]
});
