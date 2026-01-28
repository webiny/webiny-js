import { BaseError } from "webiny/api";

export class TenantNotFoundError extends BaseError {
    override readonly code = "Tenant/NotFound" as const;

    constructor(id: string) {
        super({ message: `Tenant with id "${id}" was not found!` });
    }
}

export class TenantPersistenceError extends BaseError {
    override readonly code = "Tenant/Persistence" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class TenantCreationError extends BaseError {
    override readonly code = "Tenant/Creation" as const;

    constructor(error: Error) {
        super({ message: `Failed to create tenant: ${error.message}` });
    }
}

export class TenantInstallationError extends BaseError {
    override readonly code = "Tenant/Installation" as const;

    constructor(error: Error) {
        super({ message: `Failed to install tenant: ${error.message}` });
    }
}

export class TenantUpdateError extends BaseError {
    override readonly code = "Tenant/Update" as const;

    constructor(error: Error) {
        super({ message: `Failed to update tenant: ${error.message}` });
    }
}
