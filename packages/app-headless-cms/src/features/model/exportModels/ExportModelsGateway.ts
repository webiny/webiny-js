import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { ExportModelsGateway as GatewayAbstraction } from "./abstractions.js";

interface ExportModelsResponse {
    exportStructure: {
        data: any;
        error: CmsErrorResponse | null;
    };
}

interface ExportModelsVariables {
    models?: string[];
}

const CMS_EXPORT_STRUCTURE_QUERY = /* GraphQL */ `
    query CmsExportStructure($models: [String!]) {
        exportStructure(models: $models) {
            data
            error {
                message
                code
                data
            }
        }
    }
`;

class ExportModelsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(models?: string[]) {
        const response = await this.client.execute<ExportModelsResponse, ExportModelsVariables>({
            query: CMS_EXPORT_STRUCTURE_QUERY,
            variables: { models }
        });

        const { data, error } = response.exportStructure;

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}

export const ExportModelsGateway = GatewayAbstraction.createImplementation({
    implementation: ExportModelsGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
