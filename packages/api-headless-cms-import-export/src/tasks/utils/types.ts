import { IAsset } from "./entryAssets";
import { SanitizedCmsModel } from "@webiny/api-headless-cms/export/types";
import { GenericRecord } from "@webiny/api/types";
import { CmsEntryMeta } from "@webiny/api-headless-cms/types";

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

export interface ICmsEntryEntriesJson {
    items: GenericRecord<string>[];
    meta: CmsEntryMeta;
    after?: string;
}
