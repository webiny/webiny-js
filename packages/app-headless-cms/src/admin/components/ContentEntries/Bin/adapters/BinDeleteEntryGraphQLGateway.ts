import { ApolloClient } from "apollo-client";
import { IBinDeleteEntryGateway } from "@webiny/app-bin";
import { CmsModel } from "@webiny/app-headless-cms-common/types";
import {
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables,
    createDeleteMutation
} from "@webiny/app-headless-cms-common";

export class BinDeleteEntryGraphQLGateway implements IBinDeleteEntryGateway {
    private client: ApolloClient<any>;
    private model: CmsModel;

    constructor(client: ApolloClient<any>, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            CmsEntryDeleteMutationResponse,
            CmsEntryDeleteMutationVariables
        >({
            mutation: createDeleteMutation(this.model),
            variables: {
                revision: id,
                permanently: true
            }
        });

        console.log("BinDeleteEntryGraphQLGateway - after", id);

        if (!response) {
            throw new Error("Network error while deleting entry.");
        }

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not delete the entry.");
        }

        return true;
    }
}
