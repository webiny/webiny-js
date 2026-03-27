import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ITrashWbPageParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ITrashPageRepository {
    execute(params: ITrashWbPageParams): Promise<Result<void, RepositoryError>>;
}

export interface ITrashPageRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = ITrashPageRepositoryErrors[keyof ITrashPageRepositoryErrors];

export const TrashPageRepository =
    createAbstraction<ITrashPageRepository>("Wb/TrashPageRepository");

export namespace TrashPageRepository {
    export type Interface = ITrashPageRepository;
    export type Params = ITrashWbPageParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ITrashPageUseCase {
    execute(params: ITrashWbPageParams): Promise<Result<void, UseCaseError>>;
}

export interface ITrashPageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = ITrashPageUseCaseErrors[keyof ITrashPageUseCaseErrors];

export const TrashPageUseCase = createAbstraction<ITrashPageUseCase>("Wb/TrashPageUseCase");

export namespace TrashPageUseCase {
    export type Interface = ITrashPageUseCase;
    export type Params = ITrashWbPageParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeTrashPayload {
    page: WbPage;
}

export interface PageAfterTrashPayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeTrashEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeTrashPayload>>
>("Wb/PageBeforeTrashEventHandler");

export namespace PageBeforeTrashEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeTrashPayload>>;
    export type Event = DomainEvent<PageBeforeTrashPayload>;
    export type Page = WbPage;
}

export const PageAfterTrashEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterTrashPayload>>
>("Wb/PageAfterTrashEventHandler");

export namespace PageAfterTrashEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterTrashPayload>>;
    export type Event = DomainEvent<PageAfterTrashPayload>;
    export type Page = WbPage;
}
