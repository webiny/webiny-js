import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IListPagesGateway, type ListPagesGatewayParams } from "./IListPagesGateway.js";
import type { PageGatewayDto } from "~/features/pages/listPages/PageGatewayDto.js";
import { type WbError, type WbListMeta, type WbLocation } from "~/types";

const LIST_META_FIELD = /* GraphQL */ `
    meta {
        cursor
        totalCount
        hasMoreItems
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        data
        message
    }
`;

export interface ListPagesResponse {
    websiteBuilder: {
        listPages: {
            data: PageGatewayDto[] | null;
            meta: WbListMeta;
            error: WbError | null;
        };
    };
}

export interface ListPagesQueryVariables {
    where: {
        wbyAco_location: WbLocation;
    };
    limit?: number;
    sort?: Record<string, any>;
    after?: string | null;
    search?: string;
}

export const LIST_PAGES = (PAGES_FIELDS: string) => gql`
    query ListPages($where: WbPagesListWhereInput, $limit: Int, $after: String, $sort: WbSort, $search: String) {
        websiteBuilder {
            listPages(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                data ${PAGES_FIELDS}
                ${LIST_META_FIELD}
                ${ERROR_FIELD}
            }
        }
    }
`;

export class ListPagesGqlGateway implements IListPagesGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(params: ListPagesGatewayParams) {
        const { folderId } = params;

        console.log(LIST_PAGES(this.modelFields));

        const { data: response } = await this.client.query<
            ListPagesResponse,
            ListPagesQueryVariables
        >({
            query: LIST_PAGES(this.modelFields),
            variables: {
                limit: 50,
                where: {
                    wbyAco_location: {
                        folderId
                    }
                }
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing pages.");
        }

        const { data, error, meta } = response.websiteBuilder.listPages;

        if (!data) {
            throw new Error(error?.message || "Could not fetch pages.");
        }

        return {
            pages: data,
            meta
        };
    }
}
