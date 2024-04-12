import { ApolloClient } from "apollo-client";
import { CmsContentEntry, CmsModel } from "@webiny/app-headless-cms-common/types";
import {
    CmsEntryRestoreFromBinMutationResponse,
    CmsEntryRestoreFromBinMutationVariables,
    createRestoreFromBinMutation
} from "@webiny/app-headless-cms-common";
import { ITrashBinRestoreItemGateway } from "@webiny/app-trash-bin";

export class TrashBinRestoreItemGraphQLGateway
    implements ITrashBinRestoreItemGateway<CmsContentEntry>
{
    private client: ApolloClient<any>;
    private model: CmsModel;

    constructor(client: ApolloClient<any>, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            CmsEntryRestoreFromBinMutationResponse,
            CmsEntryRestoreFromBinMutationVariables
        >({
            mutation: createRestoreFromBinMutation(this.model),
            variables: {
                revision: id
            }
        });

        if (!response) {
            throw new Error("Network error while restoring entry from trash bin.");
        }

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not fetch the restored entry.");
        }

        return data;
    }
}
