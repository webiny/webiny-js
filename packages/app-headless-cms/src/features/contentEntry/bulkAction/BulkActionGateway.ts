import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import {
    BulkActionGateway as GatewayAbstraction,
    type IBulkActionParams,
    type IBulkActionResult
} from "./abstractions.js";

interface BulkActionResponse {
    content: {
        data: IBulkActionResult | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel) {
    return /* GraphQL */ `
        mutation CmsBulkAction${model.singularApiName}($action: BulkAction${model.singularApiName}Name!, $where: ${model.singularApiName}ListWhereInput, $search: String, $data: JSON) {
            content: bulkAction${model.singularApiName}(action: $action, where: $where, search: $search, data: $data) {
                data {
                    id
                }
                error {
                    message
                    code
                    data
                }
            }
        }`;
}

class BulkActionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, action, where, search, data }: IBulkActionParams) {
        const mutation = createMutation(model);

        const response = await this.client.execute<BulkActionResponse>({
            query: mutation,
            variables: { action, where, search, data }
        });

        const { data: result, error } = response.content;

        if (!result) {
            throw new Error(error?.message || "Bulk action failed");
        }

        return result;
    }
}

export const BulkActionGateway = GatewayAbstraction.createImplementation({
    implementation: BulkActionGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
