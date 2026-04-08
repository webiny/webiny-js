import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import {
    RedirectNotFoundError,
    RedirectPersistenceError,
    RedirectNotAuthorizedError
} from "~/domain/redirect/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IMoveWbRedirectParams {
    id: string;
    folderId: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IMoveRedirectRepository {
    execute(params: IMoveWbRedirectParams): Promise<Result<WbRedirect, RepositoryError>>;
}

export interface IMoveRedirectRepositoryErrors {
    notFound: RedirectNotFoundError;
    persistence: RedirectPersistenceError;
}

type RepositoryError = IMoveRedirectRepositoryErrors[keyof IMoveRedirectRepositoryErrors];

export const MoveRedirectRepository = createAbstraction<IMoveRedirectRepository>(
    "Wb/MoveRedirectRepository"
);

export namespace MoveRedirectRepository {
    export type Interface = IMoveRedirectRepository;
    export type Params = IMoveWbRedirectParams;
    export type Return = Promise<Result<WbRedirect, RepositoryError>>;
    export type Error = RepositoryError;
    export type Redirect = WbRedirect;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IMoveRedirectUseCase {
    execute(params: IMoveWbRedirectParams): Promise<Result<WbRedirect, UseCaseError>>;
}

export interface IMoveRedirectUseCaseErrors {
    notAuthorized: RedirectNotAuthorizedError;
    notFound: RedirectNotFoundError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = IMoveRedirectUseCaseErrors[keyof IMoveRedirectUseCaseErrors];

/** Move a URL redirect to a different folder. */
export const MoveRedirectUseCase =
    createAbstraction<IMoveRedirectUseCase>("Wb/MoveRedirectUseCase");

export namespace MoveRedirectUseCase {
    export type Interface = IMoveRedirectUseCase;
    export type Params = IMoveWbRedirectParams;
    export type Return = Promise<Result<WbRedirect, UseCaseError>>;
    export type Error = UseCaseError;
    export type Redirect = WbRedirect;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface RedirectBeforeMovePayload {
    original: WbRedirect;
    input: IMoveWbRedirectParams;
}

export interface RedirectAfterMovePayload {
    original: WbRedirect;
    input: IMoveWbRedirectParams;
    redirect: WbRedirect;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into redirect lifecycle before a redirect is moved. */
export const RedirectBeforeMoveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectBeforeMovePayload>>
>("Wb/RedirectBeforeMoveEventHandler");

export namespace RedirectBeforeMoveEventHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectBeforeMovePayload>>;
    export type Event = DomainEvent<RedirectBeforeMovePayload>;
    export type Redirect = WbRedirect;
}

/** Hook into redirect lifecycle after a redirect is moved. */
export const RedirectAfterMoveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectAfterMovePayload>>
>("Wb/RedirectAfterMoveEventHandler");

export namespace RedirectAfterMoveEventHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectAfterMovePayload>>;
    export type Event = DomainEvent<RedirectAfterMovePayload>;
    export type Redirect = WbRedirect;
}
