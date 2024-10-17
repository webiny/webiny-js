import type { IAsset, IResolvedAsset } from "./entryAssets";
import type { SanitizedCmsModel } from "@webiny/api-headless-cms/export/types";
import type { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types";

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

export interface ICmsAssetsManifestJson {
    assets: NonEmptyArray<IResolvedAsset>;
    size: number;
}

export interface ICmsEntryEntriesJson {
    items: GenericRecord<string>[];
    meta: CmsEntryMeta;
    after?: string;
}
