import { CmsEntry } from "@webiny/api-headless-cms/types";
import { GenericRecord } from "@webiny/api/types";

export interface IAssetWithKey {
    key: string;
    alias?: never;
    url: string;
}

export interface IAssetWithAlias {
    key?: never;
    alias: string;
    url: string;
}

export type IAsset = IAssetWithKey | IAssetWithAlias;

export type IAssets = GenericRecord<string, IAsset>;

export type IAssignAssetsInput = Pick<CmsEntry, "values"> | Pick<CmsEntry, "values">[];

export interface IEntryAssets {
    readonly assets: IAssets;
    assignAssets(input: IAssignAssetsInput): void;
}
