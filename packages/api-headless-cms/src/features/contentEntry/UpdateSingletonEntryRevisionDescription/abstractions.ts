import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/UpdateRevisionDescription/index.js";

/**
 * UpdateSingletonEntryRevisionDescription Use Case
 *
 * Updates the description of a singleton entry revision.
 */
export interface IUpdateSingletonEntryRevisionDescriptionUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string,
        revisionDescription: string | undefined
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUpdateSingletonEntryRevisionDescriptionUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: UpdateRevisionDescriptionUseCase.Error;
}

type UseCaseError =
    IUpdateSingletonEntryRevisionDescriptionUseCaseErrors[keyof IUpdateSingletonEntryRevisionDescriptionUseCaseErrors];

/** Updates the description of a singleton entry revision. */
export const UpdateSingletonEntryRevisionDescriptionUseCase =
    createAbstraction<IUpdateSingletonEntryRevisionDescriptionUseCase>(
        "UpdateSingletonEntryRevisionDescriptionUseCase"
    );

export namespace UpdateSingletonEntryRevisionDescriptionUseCase {
    export type Interface = IUpdateSingletonEntryRevisionDescriptionUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
