import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ListUsersParams } from "~/config/gateway/IWorkflowConfigGateway.js";

/*
 * Looks users up by search, by ids or by teams; ids the server does not know come back in
 * `missingIds`. Used by the editor and the settings page (R317). Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListWorkflowUsersUseCase {
    execute(params: ListUsersParams): Promise<WorkflowUserList>;
}

export const ListWorkflowUsersUseCase = createAbstraction<IListWorkflowUsersUseCase>(
    "Workflows/ListWorkflowUsersUseCase"
);

export namespace ListWorkflowUsersUseCase {
    export type Interface = IListWorkflowUsersUseCase;
    export type Params = ListUsersParams;
}
