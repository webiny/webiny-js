import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils";
import type { CmsModel } from "~/types/index.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { createSingletonEntryId } from "~/domain/contentModel/createSingletonEntryId.js";
import { isPublishingEnabled } from "~/domain/contentModel/isPublishingEnabled.js";

export type SingletonOperation =
    | "getRevision"
    | "listRevisions"
    | "update"
    | "updateRevisionDescription"
    | "createFrom"
    | "publish"
    | "unpublish"
    | "delete";

export interface CheckSingletonRevisionParams {
    model: CmsModel;
    value: string;
    operation: SingletonOperation;
}

const PUBLISHING_OPERATIONS: SingletonOperation[] = [
    "createFrom",
    "publish",
    "unpublish",
    "delete"
];

/**
 * Steps 1-4 of the singleton "Order of checks". Stops at the first failure and returns
 * the parsed entry id on success.
 */
export function checkSingletonRevision(
    params: CheckSingletonRevisionParams
): Result<string, EntryNotFoundError | EntryValidationError> {
    const { model, value, operation } = params;

    const entryId = createSingletonEntryId(model);
    const { id, version } = parseIdentifier(value);

    // 1. The value belongs to the singleton.
    if (id !== entryId) {
        return Result.fail(new EntryNotFoundError(value));
    }

    if (operation === "listRevisions") {
        return Result.ok(entryId);
    }

    // 2. The value is a revision id.
    if (version === null) {
        if (operation === "delete") {
            return Result.fail(new EntryValidationError("Singleton entry cannot be deleted."));
        }
        return Result.fail(new EntryValidationError("A revision id is required."));
    }

    if (isPublishingEnabled(model)) {
        return Result.ok(entryId);
    }

    // 3. Untagged model and the operation needs publishing.
    if (PUBLISHING_OPERATIONS.includes(operation)) {
        return Result.fail(new EntryValidationError("Model does not support publishing."));
    }

    // 4. Untagged model: only the first revision exists.
    if (version !== 1) {
        return Result.fail(new EntryValidationError("Model does not support revisions."));
    }

    return Result.ok(entryId);
}
