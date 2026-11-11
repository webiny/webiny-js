import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "~/editor/gateway/dto.js";
import type { RoutingInspectionDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import type { RoutingStepConfig } from "~/editor/domain/types.js";

export interface ListWorkflowModelsParams {
    // The model name filter; an empty string lists every model.
    search: string;
    limit: number;
    after: string | null;
}

export interface StoreWorkflowParams {
    data: EditorWorkflowInput;
    // The `savedOn` string the editor loaded, unchanged; `null` for a new workflow or Save as new.
    savedOn: string | null;
}

export interface InspectRoutingParams {
    // `{ teams, assignment }` exactly as `toStepInput` emits it for the draft step (R300).
    stepConfig: RoutingStepConfig;
    requesterId: string;
    // `null` is the root. The CMS sends it as an omitted folder, the WB too.
    folderId: string | null;
    // The bare model id (R300); the CMS sends it, the WB ignores it.
    modelId: string | null;
}

export interface FolderExistsParams {
    id: string;
    // The rule folder's own `type` (R292); the WB ignores it (its type is always `wb:page`).
    type: string;
}

/*
 * The workflow operations one app exposes over its own GraphQL documents (R202, R347). `app` is
 * the key the routing `WorkflowEditorGateway` picks the app by. Every method resolves with the
 * shared envelope, also when the server reports an error, and rejects only on a transport failure
 * (R204); the routing gateway unwraps the envelope once for every app (R346). Each app registers
 * its implementation under the shared `WorkflowEditorAppGateway` token (`./abstractions.ts`).
 */
export interface IWorkflowEditorAppGateway {
    readonly app: WorkflowAppKind;
    listModels(params: ListWorkflowModelsParams): Promise<EditorEnvelope<WorkflowModelPageDto>>;
    getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
    storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>>;
    deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
    inspectRouting(params: InspectRoutingParams): Promise<EditorEnvelope<RoutingInspectionDto>>;
    folderExists(params: FolderExistsParams): Promise<EditorEnvelope<boolean>>;
}
