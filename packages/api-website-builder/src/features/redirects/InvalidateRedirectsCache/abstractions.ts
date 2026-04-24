import { createAbstraction } from "@webiny/feature/api";
import type { BaseError, Result } from "@webiny/feature/api";

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IInvalidateRedirectsCacheUseCase {
    execute(): Promise<Result<void, UseCaseError>>;
}

export interface IInvalidateRedirectsCacheUseCaseErrors {
    // Task service errors will be captured as generic errors
    taskError: BaseError;
}

type UseCaseError =
    IInvalidateRedirectsCacheUseCaseErrors[keyof IInvalidateRedirectsCacheUseCaseErrors];

/** Invalidate the redirects cache. */
export const InvalidateRedirectsCacheUseCase = createAbstraction<IInvalidateRedirectsCacheUseCase>(
    "Wb/InvalidateRedirectsCacheUseCase"
);

export namespace InvalidateRedirectsCacheUseCase {
    export type Interface = IInvalidateRedirectsCacheUseCase;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}
