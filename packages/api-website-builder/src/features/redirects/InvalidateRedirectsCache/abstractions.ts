import { createAbstraction } from "@webiny/feature/api";

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IInvalidateRedirectsCacheUseCase {
    // Never rejects: the CDN cache logs a failed invalidation itself.
    execute(): Promise<void>;
}

/** Invalidate the redirects cache. */
export const InvalidateRedirectsCacheUseCase = createAbstraction<IInvalidateRedirectsCacheUseCase>(
    "Wb/InvalidateRedirectsCacheUseCase"
);

export namespace InvalidateRedirectsCacheUseCase {
    export type Interface = IInvalidateRedirectsCacheUseCase;
}
