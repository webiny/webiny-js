import { BaseError } from "@webiny/feature/api";

export class TenantNotFoundError extends BaseError {
    override readonly code = "Tenant/NotFound" as const;

    constructor(id: string) {
        super({ message: `Tenant with id "${id}" was not found!` });
    }
}

export class TenantModelNotFoundError extends BaseError {
    override readonly code = "Tenant/ModelNotFound" as const;

    constructor() {
        super({ message: `Tenant model was not found!` });
    }
}

export class TenantPersistenceError extends BaseError<{ error: Error }> {
    override readonly code = "Tenant/Persist" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}

export class TenantCreationError extends BaseError<{ error: Error }> {
    override readonly code = "Tenant/Create" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}

export class TenantInstallationError extends BaseError<{ error: Error }> {
    override readonly code = "Tenant/Install" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}

export class TenantUpdateError extends BaseError<{ error: Error }> {
    override readonly code = "Tenant/Update" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}
