import { Result } from "@webiny/feature/api";
import { DeleteSingletonEntryRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/DeleteEntryRevision/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import type { CmsModel } from "~/types/index.js";

class DeleteSingletonEntryRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private deleteEntryRevision: DeleteEntryRevisionUseCase.Interface) {}

    async execute(
        model: CmsModel,
        revision: string
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({ model, value: revision, operation: "delete" });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        return await this.deleteEntryRevision.execute(model, revision);
    }
}

export const DeleteSingletonEntryRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteSingletonEntryRevisionUseCaseImpl,
    dependencies: [DeleteEntryRevisionUseCase]
});
