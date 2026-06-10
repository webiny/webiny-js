import { BaseError } from "@webiny/feature/api";
import type { ZodError } from "zod";
import { parseZodError } from "@webiny/utils";
import type { ValidationIssue } from "@webiny/utils";

export class WebhookNotFoundError extends BaseError {
    override readonly code = "WEBHOOK_NOT_FOUND" as const;

    constructor(id: string) {
        super({ message: `Webhook "${id}" was not found.` });
    }
}

export class WebhookDeliveryNotFoundError extends BaseError {
    override readonly code = "WEBHOOK_DELIVERY_NOT_FOUND" as const;

    constructor(id: string) {
        super({ message: `Webhook delivery "${id}" was not found.` });
    }
}

interface WebhookValidationErrorData {
    issues: ValidationIssue[];
}

export class WebhookValidationError extends BaseError<WebhookValidationErrorData> {
    override readonly code = "WEBHOOK_VALIDATION_ERROR" as const;

    constructor(error: string | ZodError) {
        if (typeof error === "string") {
            super({ message: error, data: { issues: [] } });
        } else {
            const issues = parseZodError(error);
            super({ message: "Validation failed.", data: { issues } });
        }
    }
}

interface WebhookPersistenceErrorData {
    originalMessage: string;
    originalCode?: string;
    originalData?: unknown;
}

export class WebhookPersistenceError extends BaseError<WebhookPersistenceErrorData> {
    override readonly code = "WEBHOOK_PERSISTENCE_ERROR" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { originalMessage: error.message } });
    }

    static from(error: unknown): WebhookPersistenceError {
        if (error instanceof Error) {
            const instance = new WebhookPersistenceError(error);
            const data: WebhookPersistenceErrorData = {
                originalMessage: error.message,
                originalCode: (error as any).code,
                originalData: (error as any).data
            };
            (instance as any).data = data;
            instance.stack = error.stack;
            return instance;
        }

        return new WebhookPersistenceError(new Error(String(error)));
    }
}

export class WebhookModelNotFoundError extends BaseError {
    override readonly code = "WEBHOOK_MODEL_NOT_FOUND" as const;

    constructor(modelId: string) {
        super({ message: `Webhook model "${modelId}" was not found.` });
    }
}

export class WebhookVerificationFailedError extends BaseError {
    override readonly code = "WEBHOOK_VERIFICATION_FAILED" as const;

    constructor(message: string) {
        super({ message });
    }
}

export class WebhookNotAuthorizedError extends BaseError {
    override readonly code = "WEBHOOK_NOT_AUTHORIZED" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}
