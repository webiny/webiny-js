import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { IWorkflowEditorUseCases } from "./IWorkflowEditorUseCases.js";
import { mapEditorWorkflow } from "~/editor/gateway/mapEditorWorkflow.js";
import { mapWorkflowModelPage } from "~/editor/gateway/mapWorkflowModelPage.js";
import { toOperationError } from "./toOperationError.js";

/*
 * The one shared implementation of the editor use cases (R202). It runs the app's gateway, maps
 * the DTOs, turns an error envelope into a thrown `GraphQLOperationError` (R204) and lets transport
 * errors pass. It is exported plain: `createImplementation` writes the abstraction and the
 * dependencies on the class, so each app binds its own subclass (R237).
 */
export class WorkflowEditorUseCases implements IWorkflowEditorUseCases {
    constructor(private gateway: IWorkflowEditorGateway) {}

    public async listModels(params: ListWorkflowModelsParams): Promise<WorkflowModelPage> {
        const envelope = await this.gateway.listModels(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapWorkflowModelPage(envelope.data);
    }

    public async getWorkflow(id: string): Promise<EditorWorkflow> {
        const envelope = await this.gateway.getWorkflow(id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }

    public async storeWorkflow(params: StoreWorkflowParams): Promise<EditorWorkflow> {
        const envelope = await this.gateway.storeWorkflow(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }

    public async deleteWorkflow(id: string): Promise<EditorWorkflow> {
        const envelope = await this.gateway.deleteWorkflow(id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapEditorWorkflow(envelope.data);
    }
}
