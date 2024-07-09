import { IContentEntryTraverser } from "@webiny/api-headless-cms";
import { EntryAssets, IEntryAssets, IEntryAssetsParams } from "~/tasks/utils/entryAssets";
import { createUniqueResolver } from "~tests/mocks/createUniqueResolver";

const defaultTraverser: IContentEntryTraverser = {
    traverse() {
        return;
    }
};

type Params = IEntryAssetsParams;

export const createEntryAssets = (params?: Params): IEntryAssets => {
    return new EntryAssets({
        traverser: params?.traverser || defaultTraverser,
        uniqueResolver: createUniqueResolver()
    });
};
