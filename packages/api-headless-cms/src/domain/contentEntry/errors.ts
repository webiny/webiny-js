import { BaseError } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";

export class EntryNotFoundError extends BaseError {
    override readonly code = "Cms/Entry/NotFound" as const;

    constructor(id?: string) {
        super({
            message: id ? `Entry "${id}" was not found!` : `Entry was not found!`
        });
    }
}

export class EntryPersistenceError extends BaseError {
    override readonly code = "Cms/Entry/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class EntryValidationError extends BaseError {
    override readonly code = "Cms/Entry/ValidationError" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

export class EntryLockedError extends BaseError {
    override readonly code = "Cms/Entry/Locked" as const;

    constructor() {
        super({
            message: `Cannot update entry because it's locked.`
        });
    }
}

export class ContentEntryNotAuthorizedError extends BaseError {
    override readonly code = "Cms/Entry/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized!"
        });
    }

    static fromModel(model: CmsModel): ContentEntryNotAuthorizedError {
        return new ContentEntryNotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`);
    }

    static fromEntry(entry: CmsEntry): ContentEntryNotAuthorizedError {
        return new ContentEntryNotAuthorizedError(`Not allowed to access entry "${entry.entryId}".`);
    }
}
