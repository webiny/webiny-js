import { BaseError } from "@webiny/feature/api";

export class RemoteComponentNotFoundError extends BaseError {
    override readonly code = "RemoteComponent/NotFound" as const;

    constructor(id: string) {
        super({ message: `Remote component with id "${id}" was not found.` });
    }
}

export class RemoteComponentBundleError extends BaseError<{ error: Error }> {
    override readonly code = "RemoteComponent/BundleError" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}

export class RemoteComponentPersistenceError extends BaseError<{ error: Error }> {
    override readonly code = "RemoteComponent/PersistenceError" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}
