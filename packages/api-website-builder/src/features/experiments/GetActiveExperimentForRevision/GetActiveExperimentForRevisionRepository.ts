import { Result } from "@webiny/feature/api";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { GetActiveExperimentForRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class GetActiveExperimentForRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private experimentModel: ExperimentModel.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async execute(revisionId: string): RepositoryAbstraction.Return {
        const result = await this.getEntry.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
            {
                where: {
                    latest: true,
                    values: {
                        baselineRevisionId: revisionId,
                        status: "running"
                    }
                }
            }
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.ok(null);
            }
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        if (!result.value) {
            return Result.ok(null);
        }

        return Result.ok(EntryToExperimentMapper.toExperiment(result.value));
    }
}

export const GetActiveExperimentForRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: GetActiveExperimentForRevisionRepositoryImpl,
    dependencies: [ExperimentModel, GetEntryUseCase]
});
