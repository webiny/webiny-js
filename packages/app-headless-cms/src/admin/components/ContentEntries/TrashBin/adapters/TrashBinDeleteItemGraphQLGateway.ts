import type { ApolloClient } from "@apollo/client";
import type { ITrashBinDeleteItemGateway } from "@webiny/app-trash-bin";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type {
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables
} from "@webiny/app-headless-cms-common";
import { createDeleteMutation } from "@webiny/app-headless-cms-common";

export class TrashBinDeleteItemGraphQLGateway implements ITrashBinDeleteItemGateway {
    private client: ApolloClient;
    private model: CmsModel;

    constructor(client: ApolloClient, model: CmsModel) {
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
