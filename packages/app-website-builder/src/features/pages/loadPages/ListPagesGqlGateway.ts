import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import type { PageGatewayDto } from "~/features/pages/loadPages/PageGatewayDto.js";
import type { IListPagesGateway } from "./IListPagesGateway.js";
import { type ListPagesGatewayParams } from "./IListPagesGateway.js";
import { type WbError, type WbListMeta } from "~/types.js";
import { Abstraction } from "@webiny/di";

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

export const LIST_PAGES = (fields: string[]) => gql`
    query ListPages($where: WbPagesListWhereInput, $limit: Int, $after: String, $sort: [WbPageListSorter], $search: String) {
        websiteBuilder {
            listPages(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                data {
                    ${fields.join("\n")}
                }
                ${LIST_META_FIELD}
                ${ERROR_FIELD}
            }
        }
    }
`;

export interface IListPagesGraphQLFieldSelection {
    getSelection(): string[];
}

export const ListPagesGraphQLFieldSelection = new Abstraction<IListPagesGraphQLFieldSelection>(
    "ListPagesGraphQLFieldSelection"
);

export interface IListPagesGatewayParams {
    client: ApolloClient<object>;
    modelFields: string[];
    fieldSelection: IListPagesGraphQLFieldSelection[];
}

export class ListPagesGqlGateway implements IListPagesGateway {
    private readonly client;
    private readonly modelFields;
    private readonly fieldSelection;
    
    public constructor(params: IListPagesGatewayParams) {
        this.client = params.client;
        this.modelFields = params.modelFields;
        this.fieldSelection = params.fieldSelection;
    }

    public async execute(params: ListPagesGatewayParams) {
        const fields = [...this.modelFields];
        for (const extraFields of this.fieldSelection) {
            fields.push(...extraFields.getSelection());
        }

        const { data: response } = await this.client.query<
            ListPagesResponse,
            ListPagesQueryVariables
        >({
            query: LIST_PAGES(fields),
            variables: {
                ...params,
                where: {
                    ...(params.where ?? {}),
                    latest: true
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
