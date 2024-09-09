import { IAsset } from "./entryAssets";
import { SanitizedCmsModel } from "@webiny/api-headless-cms/export/types";

export interface IFileMeta {
    id: number;
    name: string;
    after?: string | null;
}

export interface ICmsEntryManifestJson {
    files: IFileMeta[];
    assets?: IAsset[];
    model: SanitizedCmsModel;
}
