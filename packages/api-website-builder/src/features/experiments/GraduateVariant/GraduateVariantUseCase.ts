import { Result } from "@webiny/feature/api";
import {
    GraduateVariantUseCase as UseCaseAbstraction,
    GraduateVariantRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { GetExperimentByIdUseCase } from "~/features/experiments/GetExperimentById/index.js";
import { GetVariantByIdUseCase } from "~/features/variants/GetVariantById/index.js";
import {
    ExperimentNotAuthorizedError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

class GraduateVariantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private getExperimentById: GetExperimentByIdUseCase.Interface,
        private getVariantById: GetVariantByIdUseCase.Interface,
        private repository: GraduateVariantRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const canPublishExperiment = await this.permissions.canPublish("page");
        const canCreatePage = await this.permissions.canCreate("page");
        if (!canPublishExperiment || !canCreatePage) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        const experimentResult = await this.getExperimentById.execute(params.experimentId);
        if (experimentResult.isFail()) {
            return Result.fail(experimentResult.error);
        }
        const experiment = experimentResult.value;

        if (experiment.status === "graduated") {
            return Result.fail(
                new ExperimentValidationError("This experiment has already been graduated.")
            );
        }

        const variantResult = await this.getVariantById.execute(params.variantId);
        if (variantResult.isFail()) {
            return Result.fail(variantResult.error);
        }
        const variant = variantResult.value;

        if (variant.experimentId !== experiment.id) {
            return Result.fail(
                new ExperimentValidationError(
                    "The variant does not belong to the given experiment."
                )
            );
        }

        return this.repository.execute({
            experimentId: experiment.id,
            baselineRevisionId: experiment.baselineRevisionId,
            variantId: params.variantId,
            content: {
                properties: variant.properties,
                metadata: variant.metadata,
                bindings: variant.bindings,
                elements: variant.elements,
                extensions: variant.extensions
            }
        });
    }
}

export const GraduateVariantUseCase = UseCaseAbstraction.createImplementation({
    implementation: GraduateVariantUseCaseImpl,
    dependencies: [
        WbPermissions,
        GetExperimentByIdUseCase,
        GetVariantByIdUseCase,
        GraduateVariantRepository
    ]
});
