import { BaseError } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";

export class NotAuthorizedError extends BaseError {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized!"
        });
    }

    static fromModel(model: CmsModel): NotAuthorizedError {
        return new NotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`);
    }

    static fromEntry(entry: CmsEntry): NotAuthorizedError {
        return new NotAuthorizedError(`Not allowed to access entry "${entry.entryId}".`);
    }
}
