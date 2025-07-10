import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import type { PageGatewayDto } from "~/features/pages/loadPages/PageGatewayDto.js";
import { IListPagesGateway, type ListPagesGatewayParams } from "./IListPagesGateway.js";
import { type WbError, type WbListMeta } from "~/types";

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
        [key: string]: any;
    };
    limit: number;
    sort?: string[];
    after?: string | null;
    search?: string;
}

export const LIST_PAGES = (PAGES_FIELDS: string) => gql`
    query ListPages($where: WbPagesListWhereInput, $limit: Int, $after: String, $sort: [WbPageListSorter], $search: String) {
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
        const { data: response } = await this.client.query<
            ListPagesResponse,
            ListPagesQueryVariables
        >({
            query: LIST_PAGES(this.modelFields),
            variables: params,
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
