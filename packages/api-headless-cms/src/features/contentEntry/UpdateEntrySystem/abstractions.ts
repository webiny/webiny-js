import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel, ICmsEntrySystem } from "~/types/index.js";
import type { EntryNotAuthorizedError, EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { IUpdateEntryUseCaseErrors } from "../UpdateEntry/abstractions.js";

/**
 * Updates only `system.*` keys of an entry revision. No meta rebuild, no EntryBeforeUpdate /
 * EntryAfterUpdate events. Used by features that keep denormalised state on entries (e.g. workflows).
 */
export interface IUpdateEntrySystemUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        system: Partial<ICmsEntrySystem>
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUpdateEntrySystemUseCaseErrors extends IUpdateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
}

type UseCaseError = IUpdateEntrySystemUseCaseErrors[keyof IUpdateEntrySystemUseCaseErrors];

/** Update system keys of a content entry revision. */
export const UpdateEntrySystemUseCase = createAbstraction<IUpdateEntrySystemUseCase>(
    "Cms/Entry/UpdateEntrySystemUseCase"
);

export namespace UpdateEntrySystemUseCase {
    export type Interface = IUpdateEntrySystemUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
