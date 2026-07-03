import { Result } from "@webiny/feature/api";
import {
    GetActiveExperimentForPathUseCase as UseCaseAbstraction,
    GetActiveExperimentForPathRepository
} from "./abstractions.js";
import { GetPageByPathUseCase } from "~/features/pages/GetPageByPath/index.js";
import { IsExperimentPausedUseCase } from "~/features/experiments/ExperimentPause/index.js";
import { ExperimentPausedError } from "~/domain/experiment/errors.js";

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

        // The published, running experiment for this page (draft experiments never serve). Fails
        // with NoActiveExperimentError when there is none.
        const experimentResult = await this.repository.execute(page.entryId);
        if (experimentResult.isFail()) {
            return Result.fail(experimentResult.error);
        }
        const experiment = experimentResult.value;

        // Honour the instant kill-switch: a paused experiment serves the control.
        const pausedResult = await this.isPaused.execute(experiment.entryId);
        if (pausedResult.isOk() && pausedResult.value) {
            return Result.fail(new ExperimentPausedError(experiment.entryId));
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
