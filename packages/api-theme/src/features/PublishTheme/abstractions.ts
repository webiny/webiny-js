import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { PublishWarning, ResolvedThemeSnapshot } from "@webiny/theme-common";
import type { Theme } from "~/domain/theme/abstractions.js";
import {
    ThemeNotAuthorizedError,
    ThemeNotFoundError,
    ThemeNotPublishableError,
    ThemePersistenceError,
    ThemeValidationError
} from "~/domain/theme/errors.js";

export interface IPublishThemeParams {
    id: string;
    /** The author's note about this version — "what changed". Stored on the revision. */
    comment?: string;
}

export interface IPublishThemeRepositoryParams {
    id: string;
    /** Written onto the revision before it is locked, so the frozen values ship with the version. */
    resolved: ResolvedThemeSnapshot;
    /** The author's publish note, frozen onto the revision alongside `resolved`. */
    comment?: string;
}

export interface IPublishThemeRepository {
    execute(params: IPublishThemeRepositoryParams): Promise<Result<Theme, RepositoryError>>;
}

export interface IPublishThemeRepositoryErrors {
    notFound: ThemeNotFoundError;
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type RepositoryError = IPublishThemeRepositoryErrors[keyof IPublishThemeRepositoryErrors];

export const PublishThemeRepository = createAbstraction<IPublishThemeRepository>(
    "Theme/PublishThemeRepository"
);

export namespace PublishThemeRepository {
    export type Interface = IPublishThemeRepository;
    export type Params = IPublishThemeRepositoryParams;
    export type Return = Promise<Result<Theme, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IPublishThemeResult {
    theme: Theme;
    /** Advisory issues that did not block. Surfaced so the caller can report what shipped anyway. */
    warnings: PublishWarning[];
}

export interface IPublishThemeUseCase {
    execute(params: IPublishThemeParams): Promise<Result<IPublishThemeResult, UseCaseError>>;
}

export interface IPublishThemeUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    notFound: ThemeNotFoundError;
    notPublishable: ThemeNotPublishableError;
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IPublishThemeUseCaseErrors[keyof IPublishThemeUseCaseErrors];

/**
 * Validate, resolve aliases, freeze the snapshot onto the revision and publish it. After this the
 * version is immutable: later edits to a primitive cannot change what it renders.
 */
export const PublishThemeUseCase = createAbstraction<IPublishThemeUseCase>(
    "Theme/PublishThemeUseCase"
);

export namespace PublishThemeUseCase {
    export type Interface = IPublishThemeUseCase;
    export type Params = IPublishThemeParams;
    export type Output = IPublishThemeResult;
    export type Return = Promise<Result<IPublishThemeResult, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface ThemeBeforePublishPayload {
    theme: Theme;
    resolved: ResolvedThemeSnapshot;
}

export interface ThemeAfterPublishPayload {
    theme: Theme;
    warnings: PublishWarning[];
}

/** Hook into the theme lifecycle before a version is published. */
export const ThemeBeforePublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeBeforePublishPayload>>
>("Theme/ThemeBeforePublishEventHandler");

export namespace ThemeBeforePublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeBeforePublishPayload>>;
    export type Event = DomainEvent<ThemeBeforePublishPayload>;
}

/** Hook into the theme lifecycle after a version is published. Artifact generation hangs off this. */
export const ThemeAfterPublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeAfterPublishPayload>>
>("Theme/ThemeAfterPublishEventHandler");

export namespace ThemeAfterPublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeAfterPublishPayload>>;
    export type Event = DomainEvent<ThemeAfterPublishPayload>;
}
