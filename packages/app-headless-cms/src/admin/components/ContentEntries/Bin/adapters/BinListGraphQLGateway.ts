import { ApolloClient } from "apollo-client";
import { IBinListGateway } from "@webiny/app-bin";
import { CmsContentEntry, CmsMetaResponse, CmsModel } from "@webiny/app-headless-cms-common/types";
import {
    CmsEntriesListQueryResponse,
    CmsEntriesListQueryVariables,
    createListQuery
} from "@webiny/app-headless-cms-common";

export class BinListGraphQLGateway
    implements IBinListGateway<CmsEntriesListQueryVariables, CmsContentEntry>
{
    private client: ApolloClient<any>;
    private model: CmsModel;

    constructor(client: ApolloClient<any>, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    async execute(
        params: CmsEntriesListQueryVariables
    ): Promise<[CmsContentEntry[], CmsMetaResponse]> {
        const { data: response } = await this.client.query<
            CmsEntriesListQueryResponse,
            CmsEntriesListQueryVariables
        >({
            query: createListQuery(this.model, this.getFields(), true),
            variables: {
                ...params
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing deleted entries.");
        }

        const { data, error, meta } = response.content;

        if (!data && !meta) {
            throw new Error(error?.message || "Could not fetch deleted entries.");
        }

        return [data, meta];
    }

    private getFields() {
        return this.model.fields.filter(field => {
            return ["text", "number", "boolean", "file", "long-text", "ref", "datetime"].includes(
                field.type
            );
        });
    }
}
