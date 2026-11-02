import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface CmsEntryFolderExistsInput {
    id: string;
    /** ACO folder type, `cms:<modelId>`. */
    type: string;
}

export interface ICmsEntryFolderExistsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = ICmsEntryFolderExistsUseCaseErrors[keyof ICmsEntryFolderExistsUseCaseErrors];

export interface ICmsEntryFolderExistsUseCase {
    execute(input: CmsEntryFolderExistsInput): Promise<Result<boolean, UseCaseError>>;
}

/**
 * Whether a folder a rule names still exists (D69, R125): `editor` only, the answer only, for
 * folders the editor may not be able to open.
 */
export const CmsEntryFolderExistsUseCase = createAbstraction<ICmsEntryFolderExistsUseCase>(
    "CmsEntryFolderExistsUseCase"
);

export namespace CmsEntryFolderExistsUseCase {
    export type Interface = ICmsEntryFolderExistsUseCase;
    export type Input = CmsEntryFolderExistsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<boolean, UseCaseError>>;
}
