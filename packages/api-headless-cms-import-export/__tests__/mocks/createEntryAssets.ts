import { EntryAssets, IEntryAssets, IEntryAssetsParams } from "~/tasks/utils/entryAssets";

type Params = IEntryAssetsParams;

export const createEntryAssets = (params: Params): IEntryAssets => {
    return new EntryAssets({
        traverser: params.traverser
    });
};
