import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Theme } from "~/domain/theme/abstractions.js";
import {
    ThemeIsActiveError,
    ThemeNotAuthorizedError,
    ThemeNotFoundError,
    ThemePersistenceError
} from "~/domain/theme/errors.js";

export interface IDeleteThemeParams {
    id: string;
}

export interface IDeleteThemeRepository {
    execute(params: IDeleteThemeParams): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteThemeRepositoryErrors {
    notFound: ThemeNotFoundError;
    persistence: ThemePersistenceError;
}

type RepositoryError = IDeleteThemeRepositoryErrors[keyof IDeleteThemeRepositoryErrors];

export const DeleteThemeRepository = createAbstraction<IDeleteThemeRepository>(
    "Theme/DeleteThemeRepository"
);

export namespace DeleteThemeRepository {
    export type Interface = IDeleteThemeRepository;
    export type Params = IDeleteThemeParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IDeleteThemeUseCase {
    execute(params: IDeleteThemeParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteThemeUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    notFound: ThemeNotFoundError;
    isActive: ThemeIsActiveError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IDeleteThemeUseCaseErrors[keyof IDeleteThemeUseCaseErrors];

/** Delete a theme and all its revisions. Refused while the theme is active. */
export const DeleteThemeUseCase = createAbstraction<IDeleteThemeUseCase>(
    "Theme/DeleteThemeUseCase"
);

export namespace DeleteThemeUseCase {
    export type Interface = IDeleteThemeUseCase;
    export type Params = IDeleteThemeParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface ThemeBeforeDeletePayload {
    theme: Theme;
}

export interface ThemeAfterDeletePayload {
    theme: Theme;
}

/** Hook into the theme lifecycle before a theme is deleted. */
export const ThemeBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeBeforeDeletePayload>>
>("Theme/ThemeBeforeDeleteEventHandler");

export namespace ThemeBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeBeforeDeletePayload>>;
    export type Event = DomainEvent<ThemeBeforeDeletePayload>;
}

/** Hook into the theme lifecycle after a theme is deleted. */
export const ThemeAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeAfterDeletePayload>>
>("Theme/ThemeAfterDeleteEventHandler");

export namespace ThemeAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeAfterDeletePayload>>;
    export type Event = DomainEvent<ThemeAfterDeletePayload>;
}
