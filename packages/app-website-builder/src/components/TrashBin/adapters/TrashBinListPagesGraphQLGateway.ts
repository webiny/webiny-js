import type { ApolloClient } from "apollo-client";
import type { ITrashBinListGateway } from "@webiny/app-trash-bin";
import {
    createListTrashPagesQuery,
    type IListTrashPagesQueryResponse,
    type IListTrashPagesQueryVariables
} from "~/components/TrashBin/adapters/graphql/listQuery.js";
import type { PageGatewayDto } from "~/features/pages/loadPages/PageGatewayDto.js";
import type { WbListMeta } from "~/types.js";

interface ITrashBinListGraphQLGatewayParams {
    client: ApolloClient<object>;
    fields: string[];
}

export class TrashBinListPagesGraphQLGateway implements ITrashBinListGateway<PageGatewayDto> {
    private readonly client: ApolloClient<object>;
    private readonly fields: string[];

    public constructor(params: ITrashBinListGraphQLGatewayParams) {
        this.client = params.client;
        this.fields = params.fields;
    }

    public async execute(
        params: IListTrashPagesQueryVariables
    ): Promise<[PageGatewayDto[], WbListMeta]> {
        const { data: response } = await this.client.query<
            IListTrashPagesQueryResponse,
            IListTrashPagesQueryVariables
        >({
            query: createListTrashPagesQuery(this.fields),
            variables: {
                ...params
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing deleted entries.");
        }

        const { data, error, meta } = response.websiteBuilder.listDeletedPages;

        if (!data || !meta) {
            throw new Error(error?.message || "Could not fetch deleted entries.");
        }

        return [data, meta];
    }
}
