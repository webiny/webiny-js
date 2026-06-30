import { Result } from "@webiny/feature/api";
import { GetActiveExperimentForPathUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPageByPathUseCase } from "~/features/pages/GetPageByPath/index.js";
import { GetActiveExperimentForRevisionUseCase } from "~/features/experiments/GetActiveExperimentForRevision/index.js";
import { ListVariantsUseCase } from "~/features/variants/ListVariants/index.js";

class GetActiveExperimentForPathUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getPageByPath: GetPageByPathUseCase.Interface,
        private getActiveExperiment: GetActiveExperimentForRevisionUseCase.Interface,
        private listVariants: ListVariantsUseCase.Interface
    ) {}

    async execute(path: string): UseCaseAbstraction.Return {
        // Resolve the live (published) revision for the requested path.
        const pageResult = await this.getPageByPath.execute(path);
        if (pageResult.isFail()) {
            return Result.fail(pageResult.error);
        }
        const page = pageResult.value;

        // Is there an active experiment pinned to that revision?
        const experimentResult = await this.getActiveExperiment.execute(page.id);
        if (experimentResult.isFail()) {
            return Result.fail(experimentResult.error);
        }
        if (!experimentResult.value) {
            return Result.ok(null);
        }
        const experiment = experimentResult.value;

        // Only "ready" variants participate.
        const variantsResult = await this.listVariants.execute({
            experimentId: experiment.entryId
        });
        if (variantsResult.isFail()) {
            return Result.fail(variantsResult.error);
        }
        const variants = variantsResult.value.filter(variant => variant.status === "ready");

        return Result.ok({
            experiment,
            variants,
            revisionId: page.id,
            pageEntryId: page.entryId,
            path
        });
    }
}

export const GetActiveExperimentForPathUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetActiveExperimentForPathUseCaseImpl,
    dependencies: [GetPageByPathUseCase, GetActiveExperimentForRevisionUseCase, ListVariantsUseCase]
});
