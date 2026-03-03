import type { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import type { RedirectGatewayDto } from "~/features/redirects/loadRedirects/RedirectGatewayDto.js";
import type { IListRedirectsGateway } from "./IListRedirectsGateway.js";
import { type ListRedirectsGatewayParams } from "./IListRedirectsGateway.js";
import { type WbError, type WbListMeta } from "~/types.js";

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

export interface ListRedirectsResponse {
    websiteBuilder: {
        listRedirects: {
            data: RedirectGatewayDto[] | null;
            meta: WbListMeta;
            error: WbError | null;
        };
    };
}

export interface ListRedirectsQueryVariables {
    where: {
        [key: string]: any;
    };
    limit: number;
    sort?: string[];
    after?: string | null;
    search?: string;
}

export const LIST_PAGES = (PAGES_FIELDS: string) => gql`
    query ListRedirects($where: WbRedirectsListWhereInput, $limit: Int, $after: String, $sort: [WbRedirectListSorter], $search: String) {
        websiteBuilder {
            listRedirects(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                data ${PAGES_FIELDS}
                ${LIST_META_FIELD}
                ${ERROR_FIELD}
            }
        }
    }
`;

export class ListRedirectsGqlGateway implements IListRedirectsGateway {
    private client: ApolloClient;
    private modelFields: string;

    constructor(client: ApolloClient, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(params: ListRedirectsGatewayParams) {
        const { data: response } = await this.client.query<
            ListRedirectsResponse,
            ListRedirectsQueryVariables
        >({
            query: LIST_PAGES(this.modelFields),
            variables: {
                ...params,
                where: {
                    ...(params.where ?? {})
                }
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing redirects.");
        }

        const { data, error, meta } = response.websiteBuilder.listRedirects;

        if (!data) {
            throw new Error(error?.message || "Could not fetch redirects.");
        }

        return {
            redirects: data,
            meta
        };
    }
}
