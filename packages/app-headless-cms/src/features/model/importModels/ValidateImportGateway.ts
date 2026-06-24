import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import {
    VALIDATE_IMPORT_STRUCTURE,
    type ValidateImportStructureResponse,
    type ValidateImportStructureResponseData,
    type ImportStructureVariables
} from "~/admin/views/contentModels/importing/graphql.js";
import { ValidateImportGateway as GatewayAbstraction } from "./abstractions.js";

class ValidateImportGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(
        data: ImportStructureVariables["data"]
    ): Promise<ValidateImportStructureResponseData> {
        const response = await this.client.execute<
            ValidateImportStructureResponse,
            ImportStructureVariables
        >({
            query: VALIDATE_IMPORT_STRUCTURE,
            variables: { data }
        });

        const { data: result, error } = response.validateImportStructure;

        if (!result) {
            throw new Error(error?.message || "Could not validate import structure");
        }

        return result;
    }
}

export const ValidateImportGateway = GatewayAbstraction.createImplementation({
    implementation: ValidateImportGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
