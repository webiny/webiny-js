import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import type { WbLocation } from "~/domain/shared/abstractions.js";
import {
    RedirectNotFoundError,
    RedirectPersistenceError,
    RedirectValidationError,
    RedirectNotAuthorizedError
} from "~/domain/redirect/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IUpdateWbRedirectData {
    location?: WbLocation;
    redirectFrom?: string;
    redirectTo?: string;
    redirectType?: string;
    isEnabled?: boolean;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IUpdateRedirectRepository {
    execute(id: string, data: IUpdateWbRedirectData): Promise<Result<WbRedirect, RepositoryError>>;
}

export interface IUpdateRedirectRepositoryErrors {
    notFound: RedirectNotFoundError;
    validation: RedirectValidationError;
    persistence: RedirectPersistenceError;
}

type RepositoryError = IUpdateRedirectRepositoryErrors[keyof IUpdateRedirectRepositoryErrors];

export const UpdateRedirectRepository = createAbstraction<IUpdateRedirectRepository>(
    "Wb/UpdateRedirectRepository"
);

export namespace UpdateRedirectRepository {
    export type Interface = IUpdateRedirectRepository;
    export type UpdateData = IUpdateWbRedirectData;
    export type Return = Promise<Result<WbRedirect, RepositoryError>>;
    export type Error = RepositoryError;
    export type Redirect = WbRedirect;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IUpdateRedirectUseCase {
    execute(id: string, data: IUpdateWbRedirectData): Promise<Result<WbRedirect, UseCaseError>>;
}

export interface IUpdateRedirectUseCaseErrors {
    notAuthorized: RedirectNotAuthorizedError;
    notFound: RedirectNotFoundError;
    validation: RedirectValidationError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = IUpdateRedirectUseCaseErrors[keyof IUpdateRedirectUseCaseErrors];

export const UpdateRedirectUseCase = createAbstraction<IUpdateRedirectUseCase>(
    "Wb/UpdateRedirectUseCase"
);

export namespace UpdateRedirectUseCase {
    export type Interface = IUpdateRedirectUseCase;
    export type UpdateData = IUpdateWbRedirectData;
    export type Return = Promise<Result<WbRedirect, UseCaseError>>;
    export type Error = UseCaseError;
    export type Redirect = WbRedirect;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface RedirectBeforeUpdatePayload {
    original: WbRedirect;
    input: {
        id: string;
        data: IUpdateWbRedirectData;
    };
}

export interface RedirectAfterUpdatePayload {
    original: WbRedirect;
    input: {
        id: string;
        data: IUpdateWbRedirectData;
    };
    redirect: WbRedirect;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const RedirectBeforeUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectBeforeUpdatePayload>>
>("Wb/RedirectBeforeUpdateHandler");

export namespace RedirectBeforeUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectBeforeUpdatePayload>>;
    export type Event = DomainEvent<RedirectBeforeUpdatePayload>;
    export type Redirect = WbRedirect;
}

export const RedirectAfterUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectAfterUpdatePayload>>
>("Wb/RedirectAfterUpdateHandler");

export namespace RedirectAfterUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectAfterUpdatePayload>>;
    export type Event = DomainEvent<RedirectAfterUpdatePayload>;
    export type Redirect = WbRedirect;
}
