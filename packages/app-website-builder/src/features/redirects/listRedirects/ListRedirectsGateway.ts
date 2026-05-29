import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { Redirect, type RedirectData } from "~/domain/Redirect/Redirect.js";
import { REDIRECT_FIELDS } from "~/features/redirects/shared/graphqlFields.js";
import {
    ListRedirectsGateway as GatewayAbstraction,
    type ListRedirectsGatewayParams,
    type ListRedirectsGatewayResult,
    type ListRedirectsMeta
} from "./abstractions.js";

const LIST_REDIRECTS = /* GraphQL */ `
    query ListRedirects(
        $where: WbRedirectsListWhereInput
        $limit: Int
        $after: String
        $sort: [WbRedirectListSorter]
        $search: String
    ) {
        websiteBuilder {
            listRedirects(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                data {
                    ${REDIRECT_FIELDS}
                }
                meta {
                    cursor
                    totalCount
                    hasMoreItems
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

interface ListRedirectsResponse {
    websiteBuilder: {
        listRedirects: {
            data: RedirectData[] | null;
            meta: ListRedirectsMeta;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class ListRedirectsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult> {
        const response = await this.client.execute<ListRedirectsResponse>({
            query: LIST_REDIRECTS,
            variables: {
                search: params.search,
                where: params.where,
                sort: params.sort,
                limit: params.limit,
                after: params.after
            }
        });

        const { data, error, meta } = response.websiteBuilder.listRedirects;

        if (error) {
            throw new Error(error.message || "Could not fetch redirects.");
        }

        return {
            data: (data ?? []).map(item => Redirect.create(item)),
            meta
        };
    }
}

export const ListRedirectsGateway = GatewayAbstraction.createImplementation({
    implementation: ListRedirectsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
