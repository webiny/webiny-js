import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ListWorkflowModelsParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";

export interface ListWorkflowModelsUseCaseParams extends ListWorkflowModelsParams {
    // The app whose models the editor lists; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * One page of the app's models with the workflow bound to each. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is (R360).
 */
export interface IListWorkflowModelsUseCase {
    execute(params: ListWorkflowModelsUseCaseParams): Promise<WorkflowModelPage>;
}

export const ListWorkflowModelsUseCase = createAbstraction<IListWorkflowModelsUseCase>(
    "Workflows/ListWorkflowModelsUseCase"
);

export namespace ListWorkflowModelsUseCase {
    export type Interface = IListWorkflowModelsUseCase;
    export type Params = ListWorkflowModelsUseCaseParams;
}
