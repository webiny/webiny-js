import { createDecorator } from "@webiny/feature/api";
import { GetRevisionByIdUseCase } from "../abstractions.js";
import { Result } from "@webiny/feature/api";
import { EntryNotFoundError } from "~/domains/contentEntries/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";

/**
 * GetRevisionByIdNotDeletedDecorator - Filters out deleted entries.
 *
 * This decorator wraps the GetRevisionByIdUseCase and returns EntryNotFoundError
 * if the entry is marked as deleted (wbyDeleted flag).
 */
class GetRevisionByIdNotDeletedDecorator implements GetRevisionByIdUseCase.Interface {
    constructor(private decoratee: GetRevisionByIdUseCase.Interface) {}

    async execute(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry, GetRevisionByIdUseCase.Error>> {
        const result = await this.decoratee.execute(model, id);

        if (result.isFail()) {
            return result;
        }

        const entry = result.value;

        // Filter out deleted entries
        if (entry.wbyDeleted) {
            return Result.fail(new EntryNotFoundError(id));
        }

        return Result.ok(entry);
    }
}

export const GetRevisionByIdNotDeleted = createDecorator({
    abstraction: GetRevisionByIdUseCase,
    decorator: GetRevisionByIdNotDeletedDecorator,
    dependencies: []
});
