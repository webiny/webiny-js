import { CmsEntry } from "@webiny/api-headless-cms/types";
import { GenericRecord } from "@webiny/api/types";

export interface IKeyAsset {
    key: string;
    alias?: never;
    url: string;
}

export interface IAliasAsset {
    key?: never;
    alias: string;
    url: string;
}

export type IAsset = IKeyAsset | IAliasAsset;

export type IAssets = GenericRecord<string, IAsset>;

export type IAssignAssetsInput = Pick<CmsEntry, "values"> | Pick<CmsEntry, "values">[];

export interface IEntryAssets {
    /**
     * List of all assets that were found in all the assignAssets() method calls.
     */
    readonly assets: IAssets;
    /**
     * The output of this method is a list of assets that were found in the given input.
     * If there were any duplicates, they will not be included in the output.
     */
    assignAssets(input: IAssignAssetsInput): IAsset[];
}
