import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel, UpdateCmsEntryInput } from "~/types/index.js";
import type { EntryNotAuthorizedError, EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";

export interface IValidateEntryUserCaseExecuteResult {
    error: string;
    id: string;
    fieldId: string;
    parents: string[];
}
/**
 * ValidateEntry Use Case - Validates entry data against model field validators.
 * This can be used to validate data before creating or updating an entry.
 */

export type IValidateEntryUseCaseExecuteResult = Promise<
    Result<IValidateEntryUserCaseExecuteResult[], UseCaseError>
>;
export interface IValidateEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string | null | undefined,
        input: UpdateCmsEntryInput<T>
    ): IValidateEntryUseCaseExecuteResult;
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
    export type Return = IValidateEntryUseCaseExecuteResult;
}
