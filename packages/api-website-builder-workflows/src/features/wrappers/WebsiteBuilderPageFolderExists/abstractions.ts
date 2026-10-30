import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface WebsiteBuilderPageFolderExistsInput {
    /** A page folder id; the type is always `wb:page`. */
    id: string;
}

export interface IWebsiteBuilderPageFolderExistsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IWebsiteBuilderPageFolderExistsUseCaseErrors[keyof IWebsiteBuilderPageFolderExistsUseCaseErrors];

export interface IWebsiteBuilderPageFolderExistsUseCase {
    execute(input: WebsiteBuilderPageFolderExistsInput): Promise<Result<boolean, UseCaseError>>;
}

/**
 * Whether a page folder a rule names still exists (D69, R125): `editor` only, the answer only, for
 * folders the editor may not be able to open.
 */
export const WebsiteBuilderPageFolderExistsUseCase =
    createAbstraction<IWebsiteBuilderPageFolderExistsUseCase>(
        "WebsiteBuilderPageFolderExistsUseCase"
    );

export namespace WebsiteBuilderPageFolderExistsUseCase {
    export type Interface = IWebsiteBuilderPageFolderExistsUseCase;
    export type Input = WebsiteBuilderPageFolderExistsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<boolean, UseCaseError>>;
}
