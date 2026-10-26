import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { WorkflowsOperationResponse } from "~/editor/gateway/dto.js";
import { toOperationError } from "~/gateway/toOperationError.js";
import type { WorkflowSettingsDto } from "./dto.js";
import type { GetSettingsParams } from "~/settings/domain/GetSettingsParams.js";
import { WorkflowSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { SETTINGS_FIELDS } from "./settingsFields.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetWorkflowSettings($includeExpired: Boolean) {
        workflows {
            getSettings(includeExpired: $includeExpired) {
                data {
                    ${SETTINGS_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateWorkflowSettings($data: WorkflowsSettingsInput!) {
        workflows {
            updateSettings(data: $data) {
                data {
                    ${SETTINGS_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/*
 * The settings operations on the shared `workflows` root, one implementation for every app
 * (R317). The mutation document travels in `query`, which `MainGraphQLClient` accepts for any
 * document (A107). The gateway unwraps the envelope and throws its error (R346); mapping is the
 * repository's job.
 */
class WorkflowSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async getSettings(params: GetSettingsParams): Promise<WorkflowSettingsDto> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"getSettings", EditorEnvelope<WorkflowSettingsDto>>
        >({
            query: GET_SETTINGS,
            variables: { includeExpired: params.includeExpired }
        });

        const envelope = response.workflows.getSettings;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async updateSettings(data: WorkflowSettingsDto): Promise<WorkflowSettingsDto> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"updateSettings", EditorEnvelope<WorkflowSettingsDto>>
        >({
            query: UPDATE_SETTINGS,
            variables: { data }
        });

        const envelope = response.workflows.updateSettings;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }
}

export const WorkflowSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
