import { Result } from "@webiny/feature/api";
import { UpdateSingletonEntryRevisionDescriptionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/UpdateRevisionDescription/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

class UpdateSingletonEntryRevisionDescriptionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private updateRevisionDescription: UpdateRevisionDescriptionUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string,
        revisionDescription: string | undefined
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({
            model,
            value: revision,
            operation: "updateRevisionDescription"
        });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        return await this.updateRevisionDescription.execute<T>(
            model,
            revision,
            revisionDescription
        );
    }
}

export const UpdateSingletonEntryRevisionDescriptionUseCase =
    UseCaseAbstraction.createImplementation({
        implementation: UpdateSingletonEntryRevisionDescriptionUseCaseImpl,
        dependencies: [UpdateRevisionDescriptionUseCase]
    });
