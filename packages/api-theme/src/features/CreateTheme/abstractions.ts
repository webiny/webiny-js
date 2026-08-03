import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ThemePolicy, ThemeSettings, TokenDocument } from "@webiny/theme-common";
import type { CmsEntryTheme, Theme, ThemeProperties } from "~/domain/theme/abstractions.js";
import {
    ThemeNotAuthorizedError,
    ThemePersistenceError,
    ThemeValidationError
} from "~/domain/theme/errors.js";

/**
 * Everything but the name is optional. Anything omitted is seeded from the default theme, so a
 * theme is complete the moment it is created and publishing is never blocked by a slot nobody
 * touched — see the design brief, section 4.2.
 */
export interface ICreateThemeInput {
    properties: ThemeProperties;
    tokens?: TokenDocument;
    policy?: ThemePolicy;
    settings?: ThemeSettings;
    metadata?: Record<string, unknown>;
    extensions?: Record<string, unknown>;
}

export interface ICreateThemeRepository {
    execute(data: CmsEntryTheme): Promise<Result<Theme, RepositoryError>>;
}

export interface ICreateThemeRepositoryErrors {
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type RepositoryError = ICreateThemeRepositoryErrors[keyof ICreateThemeRepositoryErrors];

export const CreateThemeRepository = createAbstraction<ICreateThemeRepository>(
    "Theme/CreateThemeRepository"
);

export namespace CreateThemeRepository {
    export type Interface = ICreateThemeRepository;
    export type Params = CmsEntryTheme;
    export type Return = Promise<Result<Theme, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface ICreateThemeUseCase {
    execute(data: ICreateThemeInput): Promise<Result<Theme, UseCaseError>>;
}

export interface ICreateThemeUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type UseCaseError = ICreateThemeUseCaseErrors[keyof ICreateThemeUseCaseErrors];

/** Create a theme, seeded from the default theme. */
export const CreateThemeUseCase = createAbstraction<ICreateThemeUseCase>(
    "Theme/CreateThemeUseCase"
);

export namespace CreateThemeUseCase {
    export type Interface = ICreateThemeUseCase;
    export type Params = ICreateThemeInput;
    export type Return = Promise<Result<Theme, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface ThemeBeforeCreatePayload {
    input: ICreateThemeInput;
}

export interface ThemeAfterCreatePayload {
    theme: Theme;
}

/** Hook into the theme lifecycle before a theme is created. */
export const ThemeBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeBeforeCreatePayload>>
>("Theme/ThemeBeforeCreateEventHandler");

export namespace ThemeBeforeCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeBeforeCreatePayload>>;
    export type Event = DomainEvent<ThemeBeforeCreatePayload>;
}

/** Hook into the theme lifecycle after a theme is created. */
export const ThemeAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeAfterCreatePayload>>
>("Theme/ThemeAfterCreateEventHandler");

export namespace ThemeAfterCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeAfterCreatePayload>>;
    export type Event = DomainEvent<ThemeAfterCreatePayload>;
}
