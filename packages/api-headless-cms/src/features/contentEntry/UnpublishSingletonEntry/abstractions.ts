import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { UnpublishEntryUseCase } from "~/features/contentEntry/UnpublishEntry/index.js";

/**
 * UnpublishSingletonEntry Use Case
 *
 * Unpublishes a singleton entry revision.
 */
export interface IUnpublishSingletonEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUnpublishSingletonEntryUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: UnpublishEntryUseCase.Error;
}

type UseCaseError =
    IUnpublishSingletonEntryUseCaseErrors[keyof IUnpublishSingletonEntryUseCaseErrors];

/** Unpublishes a singleton entry revision. */
export const UnpublishSingletonEntryUseCase = createAbstraction<IUnpublishSingletonEntryUseCase>(
    "UnpublishSingletonEntryUseCase"
);

export namespace UnpublishSingletonEntryUseCase {
    export type Interface = IUnpublishSingletonEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
