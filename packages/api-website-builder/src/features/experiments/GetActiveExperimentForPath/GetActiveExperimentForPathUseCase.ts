import { Result } from "@webiny/feature/api";
import {
    GetActiveExperimentForPathUseCase as UseCaseAbstraction,
    GetActiveExperimentForPathRepository
} from "./abstractions.js";
import { GetPageByPathUseCase } from "~/features/pages/GetPageByPath/index.js";
import { IsExperimentPausedUseCase } from "~/features/experiments/ExperimentPause/index.js";

class GetActiveExperimentForPathUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getPageByPath: GetPageByPathUseCase.Interface,
        private repository: GetActiveExperimentForPathRepository.Interface,
        private isPaused: IsExperimentPausedUseCase.Interface
    ) {}

    async execute(path: string): UseCaseAbstraction.Return {
        // Resolve the live (published) page — this is the control.
        const pageResult = await this.getPageByPath.execute(path);
        if (pageResult.isFail()) {
            return Result.fail(pageResult.error);
        }
        const page = pageResult.value;

        // The published, running experiment for this page (draft experiments never serve).
        const experimentResult = await this.repository.getPublishedRunningExperiment(page.entryId);
        if (experimentResult.isFail()) {
            return Result.fail(experimentResult.error);
        }
        const experiment = experimentResult.value;
        if (!experiment) {
            return Result.ok(null);
        }

        // Honour the instant kill-switch: a paused experiment serves the control.
        const pausedResult = await this.isPaused.execute(experiment.entryId);
        if (pausedResult.isOk() && pausedResult.value) {
            return Result.ok(null);
        }

        return Result.ok({
            experiment,
            revisionId: page.id,
            pageEntryId: page.entryId,
            path
        });
    }
}

export const GetActiveExperimentForPathUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetActiveExperimentForPathUseCaseImpl,
    dependencies: [
        GetPageByPathUseCase,
        GetActiveExperimentForPathRepository,
        IsExperimentPausedUseCase
    ]
});
