import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { StartExperimentRepository as RepositoryAbstraction } from "./abstractions/StartExperimentRepository.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentNotFoundError, ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class StartExperimentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private experimentModel: ExperimentModel.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const result = await this.updateEntry.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
            id,
            {
                values: {
                    status: "running",
                    startedOn: new Date().toISOString()
                }
            }
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

export const StartExperimentRepository = RepositoryAbstraction.createImplementation({
    implementation: StartExperimentRepositoryImpl,
    dependencies: [UpdateEntryUseCase, ExperimentModel]
});
