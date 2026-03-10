import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import {
    RedirectPersistenceError,
    RedirectValidationError,
    RedirectNotAuthorizedError
} from "~/domain/redirect/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export type ICreateWbRedirectData = Pick<
    WbRedirect,
    "redirectFrom" | "redirectTo" | "redirectType" | "isEnabled" | "location"
>;

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICreateRedirectRepository {
    execute(data: ICreateWbRedirectData): Promise<Result<WbRedirect, RepositoryError>>;
}

export interface ICreateRedirectRepositoryErrors {
    validation: RedirectValidationError;
    persistence: RedirectPersistenceError;
}

type RepositoryError = ICreateRedirectRepositoryErrors[keyof ICreateRedirectRepositoryErrors];

export const CreateRedirectRepository = createAbstraction<ICreateRedirectRepository>(
    "Wb/CreateRedirectRepository"
);

export namespace CreateRedirectRepository {
    export type Interface = ICreateRedirectRepository;
    export type Params = ICreateWbRedirectData;
    export type Return = Promise<Result<WbRedirect, RepositoryError>>;
    export type Error = RepositoryError;
    export type Redirect = WbRedirect;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ICreateRedirectUseCase {
    execute(data: ICreateWbRedirectData): Promise<Result<WbRedirect, UseCaseError>>;
}

export interface ICreateRedirectUseCaseErrors {
    notAuthorized: RedirectNotAuthorizedError;
    validation: RedirectValidationError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = ICreateRedirectUseCaseErrors[keyof ICreateRedirectUseCaseErrors];

export const CreateRedirectUseCase = createAbstraction<ICreateRedirectUseCase>(
    "Wb/CreateRedirectUseCase"
);

export namespace CreateRedirectUseCase {
    export type Interface = ICreateRedirectUseCase;
    export type Params = ICreateWbRedirectData;
    export type Return = Promise<Result<WbRedirect, UseCaseError>>;
    export type Error = UseCaseError;
    export type Redirect = WbRedirect;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface RedirectBeforeCreatePayload {
    input: ICreateWbRedirectData;
}

export interface RedirectAfterCreatePayload {
    redirect: WbRedirect;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const RedirectBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectBeforeCreatePayload>>
>("Wb/RedirectBeforeCreateEventHandler");

export namespace RedirectBeforeCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectBeforeCreatePayload>>;
    export type Event = DomainEvent<RedirectBeforeCreatePayload>;
    export type Redirect = WbRedirect;
}

export const RedirectAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<RedirectAfterCreatePayload>>
>("Wb/RedirectAfterCreateEventHandler");

export namespace RedirectAfterCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<RedirectAfterCreatePayload>>;
    export type Event = DomainEvent<RedirectAfterCreatePayload>;
    export type Redirect = WbRedirect;
}
