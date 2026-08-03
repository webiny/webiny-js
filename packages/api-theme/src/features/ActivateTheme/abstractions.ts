import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ActiveThemePointer, Theme } from "~/domain/theme/abstractions.js";
import {
    ThemeNotAuthorizedError,
    ThemeNotFoundError,
    ThemeNeverPublishedError,
    ThemePersistenceError
} from "~/domain/theme/errors.js";

export interface IActivateThemeParams {
    /** Revision id of the published version to make live. */
    id: string;
}

export interface IActivateThemeResult {
    theme: Theme;
    pointer: ActiveThemePointer;
    /** The version that was live before this call, if any. Rollback is activating one of these. */
    previous: ActiveThemePointer | null;
}

export interface IActivateThemeUseCase {
    execute(params: IActivateThemeParams): Promise<Result<IActivateThemeResult, UseCaseError>>;
}

export interface IActivateThemeUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    notFound: ThemeNotFoundError;
    neverPublished: ThemeNeverPublishedError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IActivateThemeUseCaseErrors[keyof IActivateThemeUseCaseErrors];

/**
 * Point the tenant at a published version. Rollback is this same call against an older version —
 * there is no separate rollback operation.
 */
export const ActivateThemeUseCase = createAbstraction<IActivateThemeUseCase>(
    "Theme/ActivateThemeUseCase"
);

export namespace ActivateThemeUseCase {
    export type Interface = IActivateThemeUseCase;
    export type Params = IActivateThemeParams;
    export type Output = IActivateThemeResult;
    export type Return = Promise<Result<IActivateThemeResult, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface IDeactivateThemeResult {
    previous: ActiveThemePointer | null;
}

export interface IDeactivateThemeUseCase {
    execute(): Promise<Result<IDeactivateThemeResult, UseCaseError>>;
}

/**
 * Return the tenant to the no-active-theme state. Not a failure mode — it is the default state for
 * every project that has not opted in, and must stay reachable.
 */
export const DeactivateThemeUseCase = createAbstraction<IDeactivateThemeUseCase>(
    "Theme/DeactivateThemeUseCase"
);

export namespace DeactivateThemeUseCase {
    export type Interface = IDeactivateThemeUseCase;
    export type Output = IDeactivateThemeResult;
    export type Return = Promise<Result<IDeactivateThemeResult, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface ThemeBeforeActivatePayload {
    theme: Theme;
    previous: ActiveThemePointer | null;
}

export interface ThemeAfterActivatePayload {
    theme: Theme;
    pointer: ActiveThemePointer;
    previous: ActiveThemePointer | null;
}

export interface ThemeAfterDeactivatePayload {
    previous: ActiveThemePointer | null;
}

/** Hook into the theme lifecycle before a version is activated. */
export const ThemeBeforeActivateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeBeforeActivatePayload>>
>("Theme/ThemeBeforeActivateEventHandler");

export namespace ThemeBeforeActivateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeBeforeActivatePayload>>;
    export type Event = DomainEvent<ThemeBeforeActivatePayload>;
}

/**
 * Hook into the theme lifecycle after a version is activated. This is what the activation webhook
 * and cache invalidation hang off in phase 2.
 */
export const ThemeAfterActivateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeAfterActivatePayload>>
>("Theme/ThemeAfterActivateEventHandler");

export namespace ThemeAfterActivateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeAfterActivatePayload>>;
    export type Event = DomainEvent<ThemeAfterActivatePayload>;
}

/** Hook into the theme lifecycle after the tenant returns to having no active theme. */
export const ThemeAfterDeactivateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeAfterDeactivatePayload>>
>("Theme/ThemeAfterDeactivateEventHandler");

export namespace ThemeAfterDeactivateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeAfterDeactivatePayload>>;
    export type Event = DomainEvent<ThemeAfterDeactivatePayload>;
}
