import type { ApolloClient } from "@apollo/client";
import type { ITrashBinBulkActionsGateway } from "@webiny/app-trash-bin";
import type {
    CmsEntryBulkActionMutationResponse,
    CmsEntryBulkActionMutationVariables
} from "@webiny/app-headless-cms-common";
import { createBulkActionMutation } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { TrashBinBulkActionsGatewayParams } from "@webiny/app-trash-bin/types.js";

export class TrashBinBulkActionsGraphQLGateway implements ITrashBinBulkActionsGateway {
    private client: ApolloClient;
    private model: CmsModel;

    constructor(client: ApolloClient, model: CmsModel) {
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
