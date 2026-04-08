import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import {
    PageValidationError,
    PageNotFoundError,
    PagePersistenceError,
    PageNotAuthorizedError,
    PageTranslationError
} from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ITranslateWbPageParams {
    pageId: string;
    languageCode: string;
    folderId: string;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ITranslatePageUseCase {
    execute(params: ITranslateWbPageParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface ITranslatePageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
    translation: PageTranslationError;
}

type UseCaseError = ITranslatePageUseCaseErrors[keyof ITranslatePageUseCaseErrors];

/** Translate a page to a different language. */
export const TranslatePageUseCase =
    createAbstraction<ITranslatePageUseCase>("Wb/TranslatePageUseCase");

export namespace TranslatePageUseCase {
    export type Interface = ITranslatePageUseCase;
    export type Params = ITranslateWbPageParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}
