import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { DeleteExperimentRepository as RepositoryAbstraction } from "./abstractions/DeleteExperimentRepository.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import { ExperimentNotFoundError, ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class DeleteExperimentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private experimentModel: ExperimentModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.deleteEntry.execute(this.experimentModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ExperimentNotFoundError(params.id));
            }
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        return Result.ok(true);
    }
}

export const DeleteExperimentRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteExperimentRepositoryImpl,
    dependencies: [DeleteEntryUseCase, ExperimentModel]
});
