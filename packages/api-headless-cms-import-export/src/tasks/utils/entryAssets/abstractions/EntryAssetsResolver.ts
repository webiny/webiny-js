import { IAsset } from "./EntryAssets";
import { File } from "@webiny/api-file-manager/types/file";

export type IResolvedAsset = Omit<File, "webinyVersion" | "locale" | "tenant">;

export interface IEntryAssetsResolver {
    resolve(input: IAsset[]): Promise<IResolvedAsset[]>;
}
