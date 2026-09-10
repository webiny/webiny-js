import { Result } from "@webiny/feature/api";
import { CreateVariantUseCase as UseCaseAbstraction } from "./abstractions/CreateVariantUseCase.js";
import { CreateVariantRepository } from "./abstractions/CreateVariantRepository.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { GetExperimentByIdUseCase } from "~/features/experiments/GetExperimentById/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { VariantNotAuthorizedError } from "~/domain/variant/errors.js";

class CreateVariantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private getExperimentById: GetExperimentByIdUseCase.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private repository: CreateVariantRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new VariantNotAuthorizedError());
        }

        // Resolve the experiment to find the immutable baseline revision.
        const experimentResult = await this.getExperimentById.execute(params.experimentId);
        if (experimentResult.isFail()) {
            return Result.fail(experimentResult.error);
        }

        // A variant begins as a copy of the baseline revision's content.
        const baselineResult = await this.getPageById.execute(
            experimentResult.value.baselineRevisionId
        );
        if (baselineResult.isFail()) {
            return Result.fail(baselineResult.error);
        }

        const baseline = baselineResult.value;

        return this.repository.execute({
            experimentId: params.experimentId,
            name: params.name,
            content: {
                properties: baseline.properties,
                metadata: baseline.metadata,
                bindings: baseline.bindings,
                elements: baseline.elements,
                extensions: baseline.extensions
            }
        });
    }
}

export const CreateVariantUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateVariantUseCaseImpl,
    dependencies: [
        WbPermissions,
        GetExperimentByIdUseCase,
        GetPageByIdUseCase,
        CreateVariantRepository
    ]
});
