import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { ListExperimentsRepository as RepositoryAbstraction } from "./abstractions/ListExperimentsRepository.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class ListExperimentsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private experimentModel: ExperimentModel.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.listLatestEntries.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
            {
                where: {
                    values: {
                        pageEntryId: params.pageEntryId
                    }
                },
                sort: ["createdOn_DESC"],
                limit: 1000
            }
        );

        if (result.isFail()) {
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        const experiments = result.value.entries.map(entry =>
            EntryToExperimentMapper.toExperiment(entry)
        );

        return Result.ok(experiments);
    }
}

export const ListExperimentsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListExperimentsRepositoryImpl,
    dependencies: [ExperimentModel, ListLatestEntriesUseCase]
});
