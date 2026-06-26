import {
    ListPagesGateway as GatewayAbstraction,
    ListPagesGraphQLFieldSelection,
    type IListPagesGatewayParams,
    type IListPagesGatewayResult,
    type IListPagesGraphQLFieldSelection
} from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { Page } from "~/domain/Page/Page.js";
import type { WbListMeta } from "~/types.js";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

interface PageGqlDto {
    [key: string]: any;
}

type ListPagesResponse = {
    websiteBuilder: {
        listPages:
            | { data: PageGqlDto[]; meta: WbListMeta; error: null }
            | { data: null; meta: null; error: { code: string; message: string; data: any } };
    };
};

class ListPagesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: MainGraphQLClient.Interface,
        private fieldSelections: IListPagesGraphQLFieldSelection[]
    ) {}

    async execute(params: IListPagesGatewayParams): Promise<IListPagesGatewayResult> {
        const extraFields = ["properties", "metadata"];
        for (const selection of this.fieldSelections) {
            extraFields.push(...selection.getSelection());
        }

        const fields = getPageGraphQLFields(extraFields);

        const query = /* GraphQL */ `
            query ListPages($where: WbPagesListWhereInput, $limit: Int, $after: String, $sort: [WbPageListSorter], $search: String) {
                websiteBuilder {
                    listPages(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                        data {
                            ${fields.join("\n")}
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

        const response = await this.client.execute<ListPagesResponse>({
            query,
            variables: {
                ...params,
                where: {
                    ...(params.where ?? {}),
                    latest: true
                }
            }
        });

        const { data, error, meta } = response.websiteBuilder.listPages;

        if (!data) {
            throw new Error(error?.message || "Could not fetch pages.");
        }

        return {
            data: data.map(dto => Page.create(dto)),
            meta: meta!
        };
    }
}

export const ListPagesGateway = GatewayAbstraction.createImplementation({
    implementation: ListPagesGatewayImpl,
    dependencies: [MainGraphQLClient, [ListPagesGraphQLFieldSelection, { multiple: true }]]
});
