import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Theme } from "~/domain/theme/abstractions.js";
import {
    ThemeNotAuthorizedError,
    ThemeNotFoundError,
    ThemePersistenceError,
    ThemeValidationError
} from "~/domain/theme/errors.js";

export interface ICreateThemeRevisionFromParams {
    /** Revision id to branch from. Usually the published one the user wants to change. */
    id: string;
}

export interface ICreateThemeRevisionFromRepository {
    execute(params: ICreateThemeRevisionFromParams): Promise<Result<Theme, RepositoryError>>;
}

export interface ICreateThemeRevisionFromRepositoryErrors {
    notFound: ThemeNotFoundError;
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type RepositoryError =
    ICreateThemeRevisionFromRepositoryErrors[keyof ICreateThemeRevisionFromRepositoryErrors];

export const CreateThemeRevisionFromRepository =
    createAbstraction<ICreateThemeRevisionFromRepository>(
        "Theme/CreateThemeRevisionFromRepository"
    );

export namespace CreateThemeRevisionFromRepository {
    export type Interface = ICreateThemeRevisionFromRepository;
    export type Params = ICreateThemeRevisionFromParams;
    export type Return = Promise<Result<Theme, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface ICreateThemeRevisionFromUseCase {
    execute(params: ICreateThemeRevisionFromParams): Promise<Result<Theme, UseCaseError>>;
}

export interface ICreateThemeRevisionFromUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    notFound: ThemeNotFoundError;
    validation: ThemeValidationError;
    persistence: ThemePersistenceError;
}

type UseCaseError =
    ICreateThemeRevisionFromUseCaseErrors[keyof ICreateThemeRevisionFromUseCaseErrors];

/**
 * Branch a new draft from an existing revision. A published revision is locked, so this is how you
 * carry on editing after publishing.
 */
export const CreateThemeRevisionFromUseCase = createAbstraction<ICreateThemeRevisionFromUseCase>(
    "Theme/CreateThemeRevisionFromUseCase"
);

export namespace CreateThemeRevisionFromUseCase {
    export type Interface = ICreateThemeRevisionFromUseCase;
    export type Params = ICreateThemeRevisionFromParams;
    export type Return = Promise<Result<Theme, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface ThemeAfterCreateRevisionFromPayload {
    original: Theme;
    theme: Theme;
}

/** Hook into the theme lifecycle after a new revision is branched from an existing one. */
export const ThemeAfterCreateRevisionFromEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ThemeAfterCreateRevisionFromPayload>>
>("Theme/ThemeAfterCreateRevisionFromEventHandler");

export namespace ThemeAfterCreateRevisionFromEventHandler {
    export type Interface = IEventHandler<DomainEvent<ThemeAfterCreateRevisionFromPayload>>;
    export type Event = DomainEvent<ThemeAfterCreateRevisionFromPayload>;
}
