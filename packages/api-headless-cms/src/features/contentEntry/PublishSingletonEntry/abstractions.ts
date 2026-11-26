import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";

/**
 * PublishSingletonEntry Use Case
 *
 * Publishes a singleton entry revision.
 */
export interface IPublishSingletonEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IPublishSingletonEntryUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: PublishEntryUseCase.Error;
}

type UseCaseError = IPublishSingletonEntryUseCaseErrors[keyof IPublishSingletonEntryUseCaseErrors];

/** Publishes a singleton entry revision. */
export const PublishSingletonEntryUseCase = createAbstraction<IPublishSingletonEntryUseCase>(
    "PublishSingletonEntryUseCase"
);

export namespace PublishSingletonEntryUseCase {
    export type Interface = IPublishSingletonEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
