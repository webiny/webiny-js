import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ThemePolicy, ThemeSettings, TokenDocument } from "@webiny/theme-common";
import type { Theme, ThemeProperties } from "~/domain/theme/abstractions.js";
import {
    ThemeNotAuthorizedError,
    ThemeNotFoundError,
    ThemePersistenceError,
    ThemeValidationError
} from "~/domain/theme/errors.js";

/**
 * Every section is optional — the editor saves one group at a time. `resolved` is deliberately not
 * updatable: it is written only by publish, which is what makes a published version immutable.
 */
export interface IUpdateThemeInput {
    properties?: Partial<ThemeProperties>;
    tokens?: TokenDocument;
    policy?: ThemePolicy;
    settings?: ThemeSettings;
    metadata?: Record<string, unknown>;
    extensions?: Record<string, unknown>;
}

export interface IUpdateThemeParams {
    id: string;
    data: IUpdateThemeInput;
}

export interface IUpdateThemeRepository {
    execute(params: IUpdateThemeParams): Promise<Result<Theme, RepositoryError>>;
}

export interface IUpdateThemeRepositoryErrors {
    notFound: ThemeNotFoundError;
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type RepositoryError = IUpdateThemeRepositoryErrors[keyof IUpdateThemeRepositoryErrors];

export const UpdateThemeRepository = createAbstraction<IUpdateThemeRepository>(
    "Theme/UpdateThemeRepository"
);

export namespace UpdateThemeRepository {
    export type Interface = IUpdateThemeRepository;
    export type Params = IUpdateThemeParams;
    export type Return = Promise<Result<Theme, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IUpdateThemeUseCase {
    execute(params: IUpdateThemeParams): Promise<Result<Theme, UseCaseError>>;
}

export interface IUpdateThemeUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    notFound: ThemeNotFoundError;
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IUpdateThemeUseCaseErrors[keyof IUpdateThemeUseCaseErrors];

/** Update a draft revision. Published revisions are locked by the CMS and cannot be edited. */
export const UpdateThemeUseCase = createAbstraction<IUpdateThemeUseCase>(
    "Theme/UpdateThemeUseCase"
);

export namespace UpdateThemeUseCase {
    export type Interface = IUpdateThemeUseCase;
    export type Params = IUpdateThemeParams;
    export type Return = Promise<Result<Theme, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface ThemeBeforeUpdatePayload {
    original: Theme;
    input: IUpdateThemeInput;
}

export interface ThemeAfterUpdatePayload {
    original: Theme;
    theme: Theme;
}

/** Hook into the theme lifecycle before a theme is updated. */
export const ThemeBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeBeforeUpdatePayload>>
>("Theme/ThemeBeforeUpdateEventHandler");

export namespace ThemeBeforeUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeBeforeUpdatePayload>>;
    export type Event = DomainEvent<ThemeBeforeUpdatePayload>;
}

/** Hook into the theme lifecycle after a theme is updated. */
export const ThemeAfterUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeAfterUpdatePayload>>
>("Theme/ThemeAfterUpdateEventHandler");

export namespace ThemeAfterUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeAfterUpdatePayload>>;
    export type Event = DomainEvent<ThemeAfterUpdatePayload>;
}
