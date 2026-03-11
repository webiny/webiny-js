import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import {
    RedirectNotFoundError,
    RedirectPersistenceError,
    RedirectNotAuthorizedError
} from "~/domain/redirect/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDeleteWbRedirectParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IDeleteRedirectRepository {
    execute(params: IDeleteWbRedirectParams): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteRedirectRepositoryErrors {
    notFound: RedirectNotFoundError;
    persistence: RedirectPersistenceError;
}

type RepositoryError = IDeleteRedirectRepositoryErrors[keyof IDeleteRedirectRepositoryErrors];

export const DeleteRedirectRepository = createAbstraction<IDeleteRedirectRepository>(
    "Wb/DeleteRedirectRepository"
);

export namespace DeleteRedirectRepository {
    export type Interface = IDeleteRedirectRepository;
    export type Params = IDeleteWbRedirectParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDeleteRedirectUseCase {
    execute(params: IDeleteWbRedirectParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteRedirectUseCaseErrors {
    notAuthorized: RedirectNotAuthorizedError;
    notFound: RedirectNotFoundError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = IDeleteRedirectUseCaseErrors[keyof IDeleteRedirectUseCaseErrors];

export const DeleteRedirectUseCase = createAbstraction<IDeleteRedirectUseCase>(
    "Wb/DeleteRedirectUseCase"
);

export namespace DeleteRedirectUseCase {
    export type Interface = IDeleteRedirectUseCase;
    export type Params = IDeleteWbRedirectParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface RedirectBeforeDeletePayload {
    redirect: WbRedirect;
}

export interface RedirectAfterDeletePayload {
    redirect: WbRedirect;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const RedirectBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectBeforeDeletePayload>>
>("Wb/RedirectBeforeDeleteEventHandler");

export namespace RedirectBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectBeforeDeletePayload>>;
    export type Event = DomainEvent<RedirectBeforeDeletePayload>;
    export type Redirect = WbRedirect;
}

export const RedirectAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectAfterDeletePayload>>
>("Wb/RedirectAfterDeleteEventHandler");

export namespace RedirectAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectAfterDeletePayload>>;
    export type Event = DomainEvent<RedirectAfterDeletePayload>;
    export type Redirect = WbRedirect;
}
