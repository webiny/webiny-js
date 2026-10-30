import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { InspectRoutingParams } from "~/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { RoutingInspection } from "~/editor/domain/types.js";

export interface InspectRoutingUseCaseParams extends InspectRoutingParams {
    // The app whose routing the editor tests; the operation routes by it (R348).
    app: WorkflowAppKind;
}

/*
 * What routing would do with an unsaved step config; the editor composes the sentences (R301).
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IInspectRoutingUseCase {
    execute(params: InspectRoutingUseCaseParams): Promise<RoutingInspection>;
}

export const InspectRoutingUseCase = createAbstraction<IInspectRoutingUseCase>(
    "Workflows/InspectRoutingUseCase"
);

export namespace InspectRoutingUseCase {
    export type Interface = IInspectRoutingUseCase;
    export type Params = InspectRoutingUseCaseParams;
}
