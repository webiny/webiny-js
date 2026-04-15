import type { ApolloClient } from "apollo-client";
import type { ITrashBinRestoreItemGateway } from "@webiny/app-trash-bin";
import type {
    ITrashPageRestoreMutationResponse,
    ITrashPageRestoreMutationVariables
} from "./graphql/restoreMutation.js";
import { createRestorePageMutation } from "./graphql/restoreMutation.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

interface ITrashBinRestorePageGraphQLGatewayParams {
    client: ApolloClient<object>;
    fields: string[];
}

export class TrashBinRestorePageGraphQLGateway
    implements ITrashBinRestoreItemGateway<PageGatewayDto>
{
    private readonly client: ApolloClient<object>;
    private readonly fields: string[];

    public constructor(params: ITrashBinRestorePageGraphQLGatewayParams) {
        this.client = params.client;
        this.fields = params.fields;
    }

    public async execute(id: string): Promise<PageGatewayDto> {
        const { data: response } = await this.client.mutate<
            ITrashPageRestoreMutationResponse,
            ITrashPageRestoreMutationVariables
        >({
            mutation: createRestorePageMutation(this.fields),
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while restoring entry from trash bin.");
        }

        const { data, error } = response.websiteBuilder.restorePage;

        if (!data) {
            throw new Error(error?.message || "Could not fetch the restored entry.");
        }

        return data;
    }
}
