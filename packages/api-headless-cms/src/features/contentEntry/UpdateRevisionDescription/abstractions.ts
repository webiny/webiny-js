import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { EntryNotAuthorizedError, EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { IUpdateEntryUseCaseErrors } from "../UpdateEntry/abstractions.js";

/**
 * UpdateRevisionDescription Use Case
 */
export interface IUpdateRevisionDescriptionUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        revisionDescription: string | undefined
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUpdateRevisionDescriptionUseCaseErrors extends IUpdateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
}

type UseCaseError =
    IUpdateRevisionDescriptionUseCaseErrors[keyof IUpdateRevisionDescriptionUseCaseErrors];

/** Update a content revision description. */
export const UpdateRevisionDescriptionUseCase =
    createAbstraction<IUpdateRevisionDescriptionUseCase>(
        "Cms/Entry/UpdateRevisionDescriptionUseCase"
    );

export namespace UpdateRevisionDescriptionUseCase {
    export type Interface = IUpdateRevisionDescriptionUseCase;
    export type Meta = GenericRecord;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
