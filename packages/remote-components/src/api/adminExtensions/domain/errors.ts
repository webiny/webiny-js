import { BaseError } from "@webiny/feature/api";
import type { ZodError } from "zod";
import { parseZodError } from "@webiny/utils";
import type { ValidationIssue } from "@webiny/utils";

export class AdminExtensionNotFoundError extends BaseError {
    override readonly code = "AdminExtension/NotFound" as const;

    constructor(id: string) {
        super({ message: `Admin extension "${id}" was not found.` });
    }
}

export class AdminExtensionModelNotFoundError extends BaseError {
    override readonly code = "AdminExtension/ModelNotFound" as const;

    constructor(modelId: string) {
        super({ message: `Admin extension model "${modelId}" was not found.` });
    }
}

export class AdminExtensionNotAuthorizedError extends BaseError {
    override readonly code = "AdminExtension/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized to manage admin extensions." });
    }
}

export class AdminExtensionAlreadyExistsError extends BaseError {
    override readonly code = "AdminExtension/AlreadyExists" as const;

    constructor(kind: string, name: string) {
        super({ message: `An admin extension of kind "${kind}" named "${name}" already exists.` });
    }
}

interface AdminExtensionValidationErrorData {
    issues: ValidationIssue[];
}

export class AdminExtensionValidationError extends BaseError<AdminExtensionValidationErrorData> {
    override readonly code = "AdminExtension/Validation" as const;

    constructor(error: ZodError) {
        const issues = parseZodError(error);
        super({ message: "Validation failed.", data: { issues } });
    }
}

interface AdminExtensionPersistenceErrorData {
    originalMessage: string;
}

export class AdminExtensionPersistenceError extends BaseError<AdminExtensionPersistenceErrorData> {
    override readonly code = "AdminExtension/Persistence" as const;

    constructor(error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        super({ message, data: { originalMessage: message } });
    }
}
