import { EntryAssetsList, IEntryAssetsListParams } from "~/tasks/utils/entryAssets";

export const createEntryAssetsList = (params?: IEntryAssetsListParams) => {
    return new EntryAssetsList({
        listFiles: async () => {
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
