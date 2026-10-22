import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { Identity } from "~/features/security/IdentityContext/index.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { UserStorageError } from "~/features/users/shared/errors.js";
import type { IdentityTenant } from "~/features/security/ResolveIdentityTenants/abstractions.js";
import type { LogInNotAuthenticatedError, LogInMissingProfileError } from "./errors.js";

export interface AfterLoginPayload {
    identity: Identity;
}

export class AfterLoginEvent extends DomainEvent<AfterLoginPayload> {
    eventType = "login.afterLogin" as const;

    getHandlerAbstraction() {
        return AfterLoginEventHandler;
    }
}

/** Hook into login lifecycle after a user logs in. */
export const AfterLoginEventHandler =
    createAbstraction<IEventHandler<AfterLoginEvent>>("AfterLoginEventHandler");

export namespace AfterLoginEventHandler {
    export type Interface = IEventHandler<AfterLoginEvent>;
    export type Event = AfterLoginEvent;
}

/** The identity has a profile in the current tenant (or its parent), and is logged in. */
export interface LogInLoggedIn {
    type: "loggedIn";
    identity: Identity;
    user: AdminUser;
}

/**
 * A native identity has no profile in the current tenant, but has one in these tenants.
 * The client picks one and logs in there.
 */
export interface LogInTenantSelectionRequired {
    type: "tenantSelectionRequired";
    tenants: IdentityTenant[];
}

export type LogInOutput = LogInLoggedIn | LogInTenantSelectionRequired;

export interface ILogInUseCaseErrors {
    notAuthenticated: LogInNotAuthenticatedError;
    missingProfile: LogInMissingProfileError;
    storage: UserStorageError;
}

type LogInError = ILogInUseCaseErrors[keyof ILogInUseCaseErrors];

export interface ILogInUseCase {
    /**
     * Log in the current identity: load its user profile and publish `AfterLoginEvent`.
     * A native identity without a profile in the current tenant gets the tenants it can log into.
     */
    execute(): Promise<Result<LogInOutput, LogInError>>;
}

/** Log in the current identity. */
export const LogInUseCase = createAbstraction<ILogInUseCase>("LogInUseCase");

export namespace LogInUseCase {
    export type Interface = ILogInUseCase;
    export type Output = LogInOutput;
    export type LoggedIn = LogInLoggedIn;
    export type TenantSelectionRequired = LogInTenantSelectionRequired;
    export type Error = LogInError;
    export type Return = Promise<Result<LogInOutput, LogInError>>;
}
