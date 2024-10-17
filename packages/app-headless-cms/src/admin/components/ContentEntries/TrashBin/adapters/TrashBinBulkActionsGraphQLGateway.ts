import { ApolloClient } from "apollo-client";
import { ITrashBinBulkActionsGateway } from "@webiny/app-trash-bin";
import {
    CmsEntryBulkActionMutationResponse,
    CmsEntryBulkActionMutationVariables,
    createBulkActionMutation
} from "@webiny/app-headless-cms-common";
import { CmsModel } from "@webiny/app-headless-cms-common/types";
import { TrashBinBulkActionsGatewayParams } from "@webiny/app-trash-bin/types";

export class TrashBinBulkActionsGraphQLGateway implements ITrashBinBulkActionsGateway {
    private client: ApolloClient<any>;
    private model: CmsModel;

    constructor(client: ApolloClient<any>, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    async execute(params: TrashBinBulkActionsGatewayParams) {
        const { data: response } = await this.client.mutate<
            CmsEntryBulkActionMutationResponse,
            CmsEntryBulkActionMutationVariables
        >({
            mutation: createBulkActionMutation(this.model),
            variables: {
                ...params
            }
        });

        if (!response) {
            throw new Error("Network error while performing a bulk action.");
        }

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not perform the bulk action.");
        }

        return data;
    }
}
