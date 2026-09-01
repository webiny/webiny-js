import type {
    ITrashBinListGateway,
    ITrashBinListGatewayParams,
    ITrashBinListGatewayResult
} from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinListGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { TRASH_PAGE_FIELDS, toTrashBinItem, type TrashPageDto } from "./shared.js";

interface ListDeletedPagesResponse {
    websiteBuilder: {
        listDeletedPages: {
            data: TrashPageDto[] | null;
            meta: { hasMoreItems: boolean; totalCount: number; cursor: string | null } | null;
            error: { code: string; message: string } | null;
        };
    };
}

class WbTrashBinListGatewayImpl implements ITrashBinListGateway {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ITrashBinListGatewayParams): Promise<ITrashBinListGatewayResult> {
        const response = await this.client.execute<ListDeletedPagesResponse>({
            query: `
                query WbListDeletedPages($where: WbPagesListWhereInput, $limit: Int, $after: String, $sort: [WbPageListSorter], $search: String) {
                    websiteBuilder {
                        listDeletedPages(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                            data {
                                ${TRASH_PAGE_FIELDS}
                            }
                            meta {
                                hasMoreItems
                                totalCount
                                cursor
                            }
                            error {
                                code
                                message
                            }
                        }
                    }
                }
            `,
            variables: {
                where: params.where,
                sort: params.sort,
                limit: params.limit,
                after: params.after,
                search: params.search
            }
        });

        const { data, error, meta } = response.websiteBuilder.listDeletedPages;

        if (error) {
            throw new Error(error.message || "Could not fetch deleted pages.");
        }

        return {
            data: (data ?? []).map(toTrashBinItem),
            meta: {
                cursor: meta?.cursor ?? null,
                hasMoreItems: meta?.hasMoreItems ?? false,
                totalCount: meta?.totalCount ?? 0
            }
        };
    }
}

export const WbTrashBinListGateway = TrashBinListGateway.createImplementation({
    implementation: WbTrashBinListGatewayImpl,
    dependencies: [MainGraphQLClient]
});
