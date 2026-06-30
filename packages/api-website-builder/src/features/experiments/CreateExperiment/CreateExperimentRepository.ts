import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { CreateExperimentRepository as RepositoryAbstraction } from "./abstractions.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import {
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

class CreateExperimentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private experimentModel: ExperimentModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const values: CmsEntryWbExperimentValues = {
            pageEntryId: params.pageEntryId,
            baselineRevisionId: params.baselineRevisionId,
            status: "draft",
            name: params.name,
            trafficSplit: params.trafficSplit ?? { control: 100, variants: {} },
            targeting: params.targeting ?? { trafficPercentage: 100 },
            goals: params.goals ?? {},
            analytics: params.analytics ?? { provider: "posthog" },
            startedOn: null,
            stoppedOn: null,
            winningVariantId: null
        };

        const result = await this.createEntry.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
            { values }
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new ExperimentValidationError(result.error.message));
            }
            return Result.fail(new ExperimentPersistenceError(result.error));
        }

        return Result.ok(EntryToExperimentMapper.toExperiment(result.value));
    }
}

export const CreateExperimentRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateExperimentRepositoryImpl,
    dependencies: [CreateEntryUseCase, ExperimentModel]
});
