import type { IEntryAssetsResolverParams } from "~/tasks/utils/entryAssets";
import { EntryAssetsResolver } from "~/tasks/utils/entryAssets";

export const createEntryAssetsResolver = (params?: IEntryAssetsResolverParams) => {
    return new EntryAssetsResolver({
        fetchFiles: async () => {
            return {
                items: [],
                meta: {
                    cursor: null,
                    hasMoreItems: false,
                    totalCount: 0
                }
            };
        },
        ...params
    });
};
