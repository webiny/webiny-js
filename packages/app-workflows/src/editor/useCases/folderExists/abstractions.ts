import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { FolderExistsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";

export interface FolderExistsUseCaseParams extends FolderExistsParams {
    // The app whose folder a rule names; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * Whether a rule's folder still exists. Resolves `false` for a deleted folder (an answer, not an
 * error); throws a `GraphQLOperationError` for a server error or a missing answer, and the transport
 * `Error` as is (R346, R360).
 */
export interface IFolderExistsUseCase {
    execute(params: FolderExistsUseCaseParams): Promise<boolean>;
}

export const FolderExistsUseCase = createAbstraction<IFolderExistsUseCase>(
    "Workflows/FolderExistsUseCase"
);

export namespace FolderExistsUseCase {
    export type Interface = IFolderExistsUseCase;
    export type Params = FolderExistsUseCaseParams;
}
