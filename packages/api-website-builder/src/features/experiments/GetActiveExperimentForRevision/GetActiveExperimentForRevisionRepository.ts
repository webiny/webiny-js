import { Result } from "@webiny/feature/api";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { GetActiveExperimentForRevisionRepository as RepositoryAbstraction } from "./abstractions/GetActiveExperimentForRevisionRepository.js";
import { ExperimentModelProvider } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentPersistenceError, NoActiveExperimentError } from "~/domain/experiment/errors.js";

class GetActiveExperimentForRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private experimentModelProvider: ExperimentModelProvider.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async execute(revisionId: string): RepositoryAbstraction.Return {
        const experimentModel = await this.experimentModelProvider.get();
        const result = await this.getEntry.execute<CmsEntryWbExperimentValues>(experimentModel, {
            where: {
                latest: true,
                values: {
                    baselineRevisionId: revisionId,
                    status: "running"
                }
            }
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new NoActiveExperimentError(revisionId));
            }
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        if (!result.value) {
            return Result.fail(new NoActiveExperimentError(revisionId));
        }

        return Result.ok(EntryToExperimentMapper.toExperiment(result.value));
    }
}

export const GetActiveExperimentForRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: GetActiveExperimentForRevisionRepositoryImpl,
    dependencies: [ExperimentModelProvider, GetEntryUseCase]
});
