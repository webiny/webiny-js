import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel, CmsModelFieldValidation } from "~/types/index.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";

/**
 * ValidateEntry Use Case - Validates entry data against model field validators.
 * This can be used to validate data before creating or updating an entry.
 */
export interface IValidateEntryUseCase {
    execute(
        model: CmsModel,
        id: string | null,
        inputData: Record<string, any>
    ): Promise<Result<CmsModelFieldValidation[], UseCaseError>>;
}

export interface IValidateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    getRevisionById: GetRevisionByIdUseCase.Error;
}

type UseCaseError = IValidateEntryUseCaseErrors[keyof IValidateEntryUseCaseErrors];

export const ValidateEntryUseCase =
    createAbstraction<IValidateEntryUseCase>("ValidateEntryUseCase");

export namespace ValidateEntryUseCase {
    export type Interface = IValidateEntryUseCase;
    export type Error = UseCaseError;
}
