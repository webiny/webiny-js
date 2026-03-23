import gql from "graphql-tag";
import type { PageGatewayDto } from "~/features/pages/loadPages/PageGatewayDto.js";
import type { WbError, WbListMeta } from "~/types.js";

export interface IListTrashPagesQueryVariables {
    where?: {
        [key: string]: any;
    };
    limit?: number;
    sort?: string[];
    after?: string | null;
    search?: string;
}

export interface IListTrashPagesQueryResponse {
    websiteBuilder: {
        listTrashPages: {
            data: PageGatewayDto[] | null;
            meta: WbListMeta | null;
            error: WbError | null;
        };
    };
}

export const createListTrashPagesQuery = (fields: string[]) => {
    return gql`
        query WebsiteBuilderListTrashPages($where: WbPagesListWhereInput, $limit: Int, $after: String, $sort: [WbPageListSorter], $search: String) {
            websiteBuilder {
                listPages(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                    data {
                        ${fields.join("\n")}
                    }
                    meta {
                        hasMoreItems
                        totalCount
                    }
                }
            }
        }
    `;
};
