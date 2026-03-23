import type { ApolloClient } from "apollo-client";
import type { ITrashBinDeleteItemGateway } from "@webiny/app-trash-bin";
import { createTrashPageMutation } from "./graphql/trashMutation.js";
import type {
    ITrashPageDeleteMutationResponse,
    ITrashPageDeleteMutationVariables
} from "./graphql/trashMutation.js";

interface ITrashBinDeletePageGraphQLGatewayParams {
    client: ApolloClient<object>;
    fields: string[];
}

export class TrashBinDeletePageGraphQLGateway implements ITrashBinDeleteItemGateway {
    private readonly client: ApolloClient<object>;
    private readonly fields: string[];

    public constructor(params: ITrashBinDeletePageGraphQLGatewayParams) {
        this.client = params.client;
        this.fields = params.fields;
    }

    public async execute(id: string) {
        const { data: response } = await this.client.mutate<
            ITrashPageDeleteMutationResponse,
            ITrashPageDeleteMutationVariables
        >({
            mutation: createTrashPageMutation(this.fields),
            variables: {
                id,
                permanently: true
            }
        });

        if (!response) {
            throw new Error("Network error while deleting entry.");
        }

        const { data, error } = response.websiteBuilder.trashPage;

        if (!data) {
            throw new Error(error?.message || "Could not delete the entry.");
        }

        return true;
    }
}
