import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import {
    IMPORT_STRUCTURE,
    type ImportStructureResponse,
    type ImportStructureResponseData,
    type ImportStructureVariables
} from "~/presentation/importContentModels/graphql.js";
import { ImportModelsGateway as GatewayAbstraction } from "./abstractions.js";

class ImportModelsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(data: ImportStructureVariables["data"]): Promise<ImportStructureResponseData> {
        const response = await this.client.execute<
            ImportStructureResponse,
            ImportStructureVariables
        >({
            query: IMPORT_STRUCTURE,
            variables: { data }
        });

        const { data: result, error } = response.importStructure;

        if (!result) {
            throw new Error(error?.message || "Could not import structure");
        }

        return result;
    }
}

export const ImportModelsGateway = GatewayAbstraction.createImplementation({
    implementation: ImportModelsGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
