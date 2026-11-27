import { Result } from "@webiny/feature/api";
import { ListSingletonEntryRevisionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRevisionsByEntryIdUseCase } from "~/features/contentEntry/GetRevisionsByEntryId/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import { isPublishingEnabled } from "~/domain/contentModel/isPublishingEnabled.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

class ListSingletonEntryRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private getRevisionsByEntryId: GetRevisionsByEntryIdUseCase.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>[], UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({
            model,
            value: id,
            operation: "listRevisions"
        });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }
        const entryId = checkResult.value;

        const revisionsResult = await this.getRevisionsByEntryId.execute<T>(model, entryId);
        if (revisionsResult.isFail()) {
            return Result.fail(revisionsResult.error);
        }
        const revisions = revisionsResult.value;

        if (isPublishingEnabled(model)) {
            return Result.ok(revisions);
        }

        // Without publishing only the first revision exists. Later ones are leftovers.
        const firstRevisionId = `${entryId}#0001`;
        const firstRevisions = revisions.filter(revision => revision.id === firstRevisionId);

        return Result.ok(firstRevisions);
    }
}

export const ListSingletonEntryRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListSingletonEntryRevisionsUseCaseImpl,
    dependencies: [GetRevisionsByEntryIdUseCase]
});
