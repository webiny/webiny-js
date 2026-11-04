import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { ListTeamsParams } from "~/config/gateway/IWorkflowConfigGateway.js";

/*
 * Looks teams up by search or by ids; ids the server does not know come back in `missingIds`.
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IListWorkflowTeamsUseCase {
    execute(params: ListTeamsParams): Promise<WorkflowTeamList>;
}

export const ListWorkflowTeamsUseCase = createAbstraction<IListWorkflowTeamsUseCase>(
    "Workflows/ListWorkflowTeamsUseCase"
);

export namespace ListWorkflowTeamsUseCase {
    export type Interface = IListWorkflowTeamsUseCase;
    export type Params = ListTeamsParams;
}
