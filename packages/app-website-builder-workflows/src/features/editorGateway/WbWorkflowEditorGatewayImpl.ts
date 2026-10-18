import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { EditorEnvelope } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorErrorDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { EditorWorkflowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { RoutingInspectionDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelPageDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "@webiny/app-workflows/editor/gateway/dto.js";
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import { WB_PAGE_APP } from "~/constants.js";
import type { WbOperationResponse } from "~/features/gateway/graphql/WbOperationResponse.js";
import { WbWorkflowEditorGateway as GatewayAbstraction } from "./WbWorkflowEditorGateway.js";
import { DELETE_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/deleteWebsiteBuilderPageWorkflow.js";
import { GET_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/getWebsiteBuilderPageWorkflow.js";
import { INSPECT_WEBSITE_BUILDER_PAGE_ROUTING } from "./graphql/inspectWebsiteBuilderPageRouting.js";
import { LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES } from "./graphql/listWebsiteBuilderPageWorkflowNames.js";
import { STORE_WEBSITE_BUILDER_PAGE_WORKFLOW } from "./graphql/storeWebsiteBuilderPageWorkflow.js";
import { WEBSITE_BUILDER_PAGE_FOLDER_EXISTS } from "./graphql/websiteBuilderPageFolderExists.js";

// The one row of the WB list: Pages (R280).
const WB_PAGES_MODEL_ID = "page";
const WB_PAGES_MODEL_NAME = "Pages";

interface WbPageWorkflowNameDto {
    id: string;
    name: string;
    models: string[];
}

interface WbPageWorkflowNameListEnvelope {
    data: WbPageWorkflowNameDto[] | null;
    error: EditorErrorDto | null;
}

class WbWorkflowEditorGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    /*
     * Website Builder has one model, `wb.page`, so there is nothing to search or page: the
     * parameters are ignored and the answer is the single last page with the row Pages and the
     * page workflow that binds it.
     */
    async listModels(): Promise<EditorEnvelope<WorkflowModelPageDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"listWebsiteBuilderPageWorkflows", WbPageWorkflowNameListEnvelope>
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES
        });

        const envelope = response.websiteBuilder.listWebsiteBuilderPageWorkflows;
        if (envelope.error) {
            return { data: null, error: envelope.error };
        }
        if (!envelope.data) {
            return { data: null, error: null };
        }
        const bound = envelope.data.find(workflow => workflow.models.includes(WB_PAGE_APP));
        const row: WorkflowModelRowDto = {
            model: WB_PAGE_APP,
            modelId: WB_PAGES_MODEL_ID,
            name: WB_PAGES_MODEL_NAME,
            workflow: null
        };
        if (bound) {
            row.workflow = { id: bound.id, name: bound.name };
        }
        return {
            data: { rows: [row], meta: { cursor: null, hasMoreItems: false } },
            error: null
        };
    }

    async getWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"getWebsiteBuilderPageWorkflow", EditorEnvelope<EditorWorkflowDto>>
        >({
            query: GET_WEBSITE_BUILDER_PAGE_WORKFLOW,
            variables: { id }
        });

        return response.websiteBuilder.getWebsiteBuilderPageWorkflow;
    }

    async storeWorkflow(params: StoreWorkflowParams): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "storeWebsiteBuilderPageWorkflow",
                EditorEnvelope<EditorWorkflowDto>
            >
        >({
            query: STORE_WEBSITE_BUILDER_PAGE_WORKFLOW,
            variables: { data: params.data, savedOn: params.savedOn }
        });

        return response.websiteBuilder.storeWebsiteBuilderPageWorkflow;
    }

    async deleteWorkflow(id: string): Promise<EditorEnvelope<EditorWorkflowDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "deleteWebsiteBuilderPageWorkflow",
                EditorEnvelope<EditorWorkflowDto>
            >
        >({
            query: DELETE_WEBSITE_BUILDER_PAGE_WORKFLOW,
            variables: { id }
        });

        return response.websiteBuilder.deleteWebsiteBuilderPageWorkflow;
    }

    /*
     * Website Builder has one model and one folder type, so `modelId` is not sent: the schema has
     * no such argument (R291).
     */
    async inspectRouting(
        params: InspectRoutingParams
    ): Promise<EditorEnvelope<RoutingInspectionDto>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "inspectWebsiteBuilderPageRouting",
                EditorEnvelope<RoutingInspectionDto>
            >
        >({
            query: INSPECT_WEBSITE_BUILDER_PAGE_ROUTING,
            variables: {
                stepConfig: params.stepConfig,
                requesterId: params.requesterId,
                folderId: params.folderId
            }
        });

        return response.websiteBuilder.inspectWebsiteBuilderPageRouting;
    }

    // Page folders only, so the folder type is not sent (R291).
    async folderExists(params: FolderExistsParams): Promise<EditorEnvelope<boolean>> {
        const response = await this.client.execute<
            WbOperationResponse<"websiteBuilderPageFolderExists", EditorEnvelope<boolean>>
        >({
            query: WEBSITE_BUILDER_PAGE_FOLDER_EXISTS,
            variables: { id: params.id }
        });

        return response.websiteBuilder.websiteBuilderPageFolderExists;
    }
}

export const WbWorkflowEditorGateway = GatewayAbstraction.createImplementation({
    implementation: WbWorkflowEditorGatewayImpl,
    dependencies: [MainGraphQLClient]
});
