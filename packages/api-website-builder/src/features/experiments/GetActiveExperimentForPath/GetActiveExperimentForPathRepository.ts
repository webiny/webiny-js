import { Result } from "@webiny/feature/api";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { GetActiveExperimentForPathRepository as RepositoryAbstraction } from "./abstractions.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentPersistenceError, NoActiveExperimentError } from "~/domain/experiment/errors.js";

class GetActiveExperimentForPathRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private experimentModel: ExperimentModel.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async execute(pageEntryId: string): RepositoryAbstraction.Return {
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
                return Result.fail(new NoActiveExperimentError(pageEntryId));
            }
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        if (!result.value) {
            return Result.fail(new NoActiveExperimentError(pageEntryId));
        }

        return Result.ok(EntryToExperimentMapper.toExperiment(result.value));
    }
}

export const GetActiveExperimentForPathRepository = RepositoryAbstraction.createImplementation({
    implementation: GetActiveExperimentForPathRepositoryImpl,
    dependencies: [ExperimentModel, GetEntryUseCase]
});
