import type { EditorEnvelope } from "./dto.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { WorkflowModelPageDto } from "./dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";

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

/*
 * The workflow operations one app exposes over its own GraphQL documents (R202). Every method
 * resolves with the shared envelope, also when the server reports an error, and rejects only on a
 * transport failure (R204). There is no abstraction token here: each app creates its own over this
 * interface.
 */
export interface IWorkflowEditorGateway {
    listModels(params: ListWorkflowModelsParams): Promise<EditorEnvelope<WorkflowModelPageDto>>;
    getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
    storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>>;
    deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>>;
}
