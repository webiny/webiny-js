import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import { RedirectNotFoundError, RedirectPersistenceError } from "~/domain/redirect/errors.js";

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
    "DeleteRedirectRepository"
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
    notFound: RedirectNotFoundError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = IDeleteRedirectUseCaseErrors[keyof IDeleteRedirectUseCaseErrors];

export const DeleteRedirectUseCase =
    createAbstraction<IDeleteRedirectUseCase>("DeleteRedirectUseCase");

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

export const RedirectBeforeDeleteHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectBeforeDeletePayload>>
>("RedirectBeforeDeleteHandler");

export namespace RedirectBeforeDeleteHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectBeforeDeletePayload>>;
    export type Event = DomainEvent<RedirectBeforeDeletePayload>;
}

export const RedirectAfterDeleteHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectAfterDeletePayload>>
>("RedirectAfterDeleteHandler");

export namespace RedirectAfterDeleteHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectAfterDeletePayload>>;
    export type Event = DomainEvent<RedirectAfterDeletePayload>;
}
