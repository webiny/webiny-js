import { Result } from "@webiny/feature/api";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { GetActiveExperimentForPathRepository as RepositoryAbstraction } from "./abstractions.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class GetActiveExperimentForPathRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private experimentModel: ExperimentModel.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async getPublishedRunningExperiment(pageEntryId: string) {
        const result = await this.getEntry.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
            {
                where: {
                    published: true,
                    values: {
                        pageEntryId,
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

export const GetActiveExperimentForPathRepository = RepositoryAbstraction.createImplementation({
    implementation: GetActiveExperimentForPathRepositoryImpl,
    dependencies: [ExperimentModel, GetEntryUseCase]
});
