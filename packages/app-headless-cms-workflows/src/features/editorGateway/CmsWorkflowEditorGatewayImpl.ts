import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { EditorEnvelope } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorErrorDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorListMetaDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { ListWorkflowModelsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { CmsOperationResponse } from "~/features/gateway/graphql/CmsOperationResponse.js";
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./CmsWorkflowEditorGateway.js";
import { DELETE_CMS_ENTRY_WORKFLOW } from "./graphql/deleteCmsEntryWorkflow.js";
import { GET_CMS_ENTRY_WORKFLOW } from "./graphql/getCmsEntryWorkflow.js";
import { LIST_CMS_ENTRY_WORKFLOW_MODELS } from "./graphql/listCmsEntryWorkflowModels.js";
import { STORE_CMS_ENTRY_WORKFLOW } from "./graphql/storeCmsEntryWorkflow.js";

// A list answer of the server: the rows and the page meta next to the error.
interface CmsWorkflowModelListEnvelope {
    data: WorkflowModelRowDto[] | null;
    meta: EditorListMetaDto | null;
    error: EditorErrorDto | null;
}

class CmsWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listModels(
        params: ListWorkflowModelsParams
    ): Promise<EditorEnvelope<WorkflowModelPageDto>> {
        const search = params.search.length > 0 ? params.search : null;

        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryWorkflowModels", CmsWorkflowModelListEnvelope>
        >({
            query: LIST_CMS_ENTRY_WORKFLOW_MODELS,
            variables: { search, limit: params.limit, after: params.after }
        });

        const envelope = response.cms.listCmsEntryWorkflowModels;
        if (envelope.error) {
            return { data: null, error: envelope.error };
        }
        if (!envelope.data) {
            return { data: null, error: null };
        }
        const meta: EditorListMetaDto = envelope.meta ?? { cursor: null, hasMoreItems: false };
        return { data: { rows: envelope.data, meta }, error: null };
    }

    async getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"getCmsEntryWorkflow", EditorEnvelope<EditorWorkflowDto>>
        >({
            query: GET_CMS_ENTRY_WORKFLOW,
            variables: { id }
        });

        return response.cms.getCmsEntryWorkflow;
    }

    async storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"storeCmsEntryWorkflow", EditorEnvelope<EditorWorkflowDto>>
        >({
            query: STORE_CMS_ENTRY_WORKFLOW,
            variables: { data: params.data, savedOn: params.savedOn }
        });

        return response.cms.storeCmsEntryWorkflow;
    }

    async deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"deleteCmsEntryWorkflow", EditorEnvelope<EditorWorkflowDto>>
        >({
            query: DELETE_CMS_ENTRY_WORKFLOW,
            variables: { id }
        });

        return response.cms.deleteCmsEntryWorkflow;
    }
}

export const CmsWorkflowEditorGateway = GatewayAbstraction.createImplementation({
    implementation: CmsWorkflowEditorGatewayImpl,
    dependencies: [MainGraphQLClient]
});
