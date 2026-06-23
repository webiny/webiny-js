import { createAbstraction } from "@webiny/feature/api";
import type { File as IFile } from "~/domain/file/types.js";

export interface IAssetAuthorizer {
    authorize(file: IFile): Promise<void>;
}

export const AssetAuthorizer = createAbstraction<IAssetAuthorizer>("AssetDelivery/AssetAuthorizer");

export namespace AssetAuthorizer {
    export type Interface = IAssetAuthorizer;
    export type File = IFile;
}
