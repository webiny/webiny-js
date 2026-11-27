import { Result } from "@webiny/feature/api";
import { GetSingletonEntryRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

class GetSingletonEntryRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private getRevisionById: GetRevisionByIdUseCase.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({
            model,
            value: revision,
            operation: "getRevision"
        });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        return await this.getRevisionById.execute<T>(model, revision);
    }
}

export const GetSingletonEntryRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSingletonEntryRevisionUseCaseImpl,
    dependencies: [GetRevisionByIdUseCase]
});
