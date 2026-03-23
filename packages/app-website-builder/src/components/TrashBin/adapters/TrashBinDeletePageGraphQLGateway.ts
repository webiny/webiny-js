import type { ApolloClient } from "apollo-client";
import type { ITrashBinDeleteItemGateway } from "@webiny/app-trash-bin";
import type {
    IPermanentDeletePageMutationResponse,
    IPermanentDeletePageMutationVariables
} from "./graphql/permanentDeleteMutation.js";
import { createPermanentDeletePageMutation } from "./graphql/permanentDeleteMutation.js";

interface ITrashBinDeletePageGraphQLGatewayParams {
    client: ApolloClient<object>;
}

export class TrashBinDeletePageGraphQLGateway implements ITrashBinDeleteItemGateway {
    private readonly client: ApolloClient<object>;

    public constructor(params: ITrashBinDeletePageGraphQLGatewayParams) {
        this.client = params.client;
    }

    public async execute(id: string) {
        const { data: response } = await this.client.mutate<
            IPermanentDeletePageMutationResponse,
            IPermanentDeletePageMutationVariables
        >({
            mutation: createPermanentDeletePageMutation(),
            variables: {
                id,
                permanently: true
            }
        });

        if (!response) {
            throw new Error("Network error while deleting entry.");
        }

        const { data, error } = response.websiteBuilder.deletePage;

        if (!data) {
            throw new Error(error?.message || "Could not delete the entry.");
        }

        return true;
    }
}
