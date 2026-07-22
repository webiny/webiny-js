import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { StopExperimentRepository as RepositoryAbstraction } from "./abstractions/StopExperimentRepository.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentNotFoundError, ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class StopExperimentRepositoryImpl implements RepositoryAbstraction.Interface {
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
                    status: "stopped",
                    stoppedOn: new Date().toISOString()
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

export const StopExperimentRepository = RepositoryAbstraction.createImplementation({
    implementation: StopExperimentRepositoryImpl,
    dependencies: [UpdateEntryUseCase, ExperimentModel]
});
