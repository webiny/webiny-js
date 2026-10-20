import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { IWorkflowEditorUseCases } from "./IWorkflowEditorUseCases.js";
import { mapEditorWorkflow } from "~/editor/gateway/mapEditorWorkflow.js";
import { mapRoutingInspection } from "~/editor/gateway/mapRoutingInspection.js";
import { mapWorkflowModelPage } from "~/editor/gateway/mapWorkflowModelPage.js";
import { toOperationError } from "~/gateway/toOperationError.js";

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

    public async inspectRouting(params: InspectRoutingParams): Promise<RoutingInspection> {
        const envelope = await this.gateway.inspectRouting(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapRoutingInspection(envelope.data);
    }

    public async folderExists(params: FolderExistsParams): Promise<boolean> {
        const envelope = await this.gateway.folderExists(params);
        // `false` is a valid answer, so only a missing answer (`null`, `undefined`) is an error.
        if (envelope.error || typeof envelope.data !== "boolean") {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }
}
