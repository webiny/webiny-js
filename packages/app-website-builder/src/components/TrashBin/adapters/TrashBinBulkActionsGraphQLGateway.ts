import type { ApolloClient } from "apollo-client";
import type { ITrashBinBulkActionsGateway } from "@webiny/app-trash-bin";
import type { TrashBinBulkActionsGatewayParams } from "@webiny/app-trash-bin/types.js";
import { createBulkActionsMutation } from "./graphql/bulkActionsMutation.js";
import type {
    IBulkActionsMutationResponse,
    IBulkActionsMutationVariables
} from "./graphql/bulkActionsMutation.js";

interface ITrashBinBulkActionsGraphQLGatewayParams {
    client: ApolloClient<object>;
    fields: string[];
}

export class TrashBinBulkActionsGraphQLGateway implements ITrashBinBulkActionsGateway {
    private client;
    private fields;

    constructor(params: ITrashBinBulkActionsGraphQLGatewayParams) {
        this.client = params.client;
        this.fields = params.fields;
    }

    async execute(params: TrashBinBulkActionsGatewayParams) {
        const { data: response } = await this.client.mutate<
            IBulkActionsMutationResponse,
            IBulkActionsMutationVariables
        >({
            mutation: createBulkActionsMutation(this.fields),
            variables: {
                ...params
            }
        });

        if (!response) {
            throw new Error("Network error while performing a bulk action.");
        }

        const { data, error } = response.websiteBuilder.bulkActions;

        if (!data) {
            throw new Error(error?.message || "Could not perform the bulk action.");
        }

        return data;
    }
}
