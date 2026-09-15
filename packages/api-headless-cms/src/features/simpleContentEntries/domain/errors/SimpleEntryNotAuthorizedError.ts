import { BaseError } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";

export class SimpleEntryNotAuthorizedError extends BaseError {
    override readonly code = "Cms/SimpleEntry/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized!"
        });
    }

    static fromModel(model: Pick<CmsModel, "modelId">): SimpleEntryNotAuthorizedError {
        return new SimpleEntryNotAuthorizedError(
            `Not allowed to access "${model.modelId}" entries.`
        );
    }

    static fromEntry(entry: Pick<ISimpleCmsEntry, "entryId">): SimpleEntryNotAuthorizedError {
        return new SimpleEntryNotAuthorizedError(`Not allowed to access entry "${entry.entryId}".`);
    }
}
