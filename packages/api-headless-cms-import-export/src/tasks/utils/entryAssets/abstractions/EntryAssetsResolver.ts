import type { IAsset } from "./EntryAssets.js";
import type { File } from "@webiny/api-file-manager/domain/file/types.js";

export type IResolvedAsset = Omit<
    File,
    | "savedBy"
    | "savedOn"
    | "modifiedBy"
    | "modifiedOn"
    | "accessControl"
    | "createdBy"
    | "createdOn"
>;

export interface IEntryAssetsResolver {
    resolve(input: IAsset[]): Promise<IResolvedAsset[]>;
}
