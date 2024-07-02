import {
    File,
    FileListMeta,
    FileListWhereParams,
    FilesListOpts
} from "@webiny/api-file-manager/types";
import { IAssetItem, IEntryAssetsList } from "./abstractions/EntryAssetsList";
import { IAssets } from "./abstractions/EntryAssets";

export interface IListFilesCb {
    (opts?: FilesListOpts): Promise<[File[], FileListMeta]>;
}

export interface IEntryAssetsListParams {
    listFiles: IListFilesCb;
}

export class EntryAssetsList implements IEntryAssetsList {
    private readonly listFiles: IListFilesCb;

    public constructor(params: IEntryAssetsListParams) {
        this.listFiles = params.listFiles;
    }

    public async resolve(input: IAssets): Promise<IAssetItem[]> {
        const keys: string[] = [];
        const aliases: string[] = [];
        for (const url in input) {
            const asset = input[url];
            if (asset.key) {
                keys.push(asset.key);
            } else if (asset.alias) {
                aliases.push(asset.alias);
            }
        }

        const assets: IAssetItem[] = [];
        const where: FileListWhereParams = {};
        if (keys.length > 0 && aliases.length > 0) {
            where.OR = [
                {
                    key_in: keys
                },
                {
                    aliases_in: aliases
                }
            ];
        } else if (keys.length > 0) {
            where.key_in = keys;
        } else if (aliases.length > 0) {
            where.aliases_in = aliases;
        } else {
            return assets;
        }

        const list = async (after?: string) => {
            return this.listFiles({
                where,
                limit: 10000000,
                after
            });
        };

        let after: string | undefined = undefined;
        while (true) {
            /**
             * Unfortunately we must cast the result, because TS is not able to infer the correct type.
             */
            const results = (await list(after)) as [File[], FileListMeta];
            const [files, meta] = results;
            for (const file of files) {
                assets.push({
                    id: file.id,
                    key: file.key,
                    aliases: file.aliases || []
                });
            }
            if (!meta.hasMoreItems) {
                return assets;
            }
            after = meta.cursor || undefined;
        }
    }
}
