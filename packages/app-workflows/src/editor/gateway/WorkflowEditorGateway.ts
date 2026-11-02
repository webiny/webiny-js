import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
import { toOperationError } from "~/gateway/toOperationError.js";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { RoutingInspectionDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import { WorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";

/*
 * Registration order (R349): this singleton collects the app gateways when it is first built, so
 * nothing may resolve it, the editor repository or an editor use case while the plugins render.
 * Route elements and editor components resolve it after every app has registered its gateway.
 *
 * Each method sends the app gateway exactly the parameters it took before the routing existed,
 * built field by field without `app` (R347), and unwraps the envelope once for every app (R346).
 */
class WorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private appGateways: WorkflowEditorAppGateway.Interface[]) {}

    async listModels(params: ListWorkflowModelsUseCase.Params): Promise<WorkflowModelPageDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.listModels({
            search: params.search,
            limit: params.limit,
            after: params.after
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getWorkflow(params: GetWorkflowUseCase.Params): Promise<EditorWorkflowDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.getWorkflow(params.id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async storeWorkflow(params: StoreWorkflowUseCase.Params): Promise<EditorWorkflowDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.storeWorkflow({
            data: params.data,
            savedOn: params.savedOn
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async deleteWorkflow(params: DeleteWorkflowUseCase.Params): Promise<EditorWorkflowDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.deleteWorkflow(params.id);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async inspectRouting(params: InspectRoutingUseCase.Params): Promise<RoutingInspectionDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.inspectRouting({
            stepConfig: params.stepConfig,
            requesterId: params.requesterId,
            folderId: params.folderId,
            modelId: params.modelId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async folderExists(params: FolderExistsUseCase.Params): Promise<boolean> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.folderExists({ id: params.id, type: params.type });
        // `false` is a valid answer, so only a missing answer (`null`, `undefined`) is an error.
        if (envelope.error || typeof envelope.data !== "boolean") {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    // The first registered app gateway of the app wins (A114); an app nobody registered is a plain error.
    private forApp(app: WorkflowAppKind): WorkflowEditorAppGateway.Interface {
        const appGateway = this.appGateways.find(item => item.app === app);
        if (!appGateway) {
            throw new Error(`No workflows app is registered for "${app}".`);
        }
        return appGateway;
    }
}

export const WorkflowEditorGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowEditorGatewayImpl,
    dependencies: [[WorkflowEditorAppGateway, { multiple: true }]]
});
