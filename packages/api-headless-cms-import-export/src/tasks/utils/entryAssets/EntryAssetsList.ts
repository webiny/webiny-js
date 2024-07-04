import {
    File,
    FileListMeta,
    FileListWhereParams,
    FilesListOpts
} from "@webiny/api-file-manager/types";
import { IEntryAssetsList, IResolvedAsset } from "./abstractions/EntryAssetsList";
import { IAsset } from "./abstractions/EntryAssets";

export interface IListFilesCbResult {
    items: File[];
    meta: FileListMeta;
}

export interface IListFilesCb {
    (opts?: FilesListOpts): Promise<IListFilesCbResult>;
}

export interface IEntryAssetsListParams {
    listFiles: IListFilesCb;
}

const createResolvedAsset = (file: Partial<File>): IResolvedAsset => {
    const result = {
        ...file,
        aliases: file.aliases || []
    } as Partial<File>;

    delete file.tenant;
    delete file.locale;
    delete file.accessControl;
    delete file.webinyVersion;

    return result as IResolvedAsset;
};

export class EntryAssetsList implements IEntryAssetsList {
    private readonly listFiles: IListFilesCb;

    public constructor(params: IEntryAssetsListParams) {
        this.listFiles = params.listFiles;
    }

    public async resolve(input: IAsset[]): Promise<IResolvedAsset[]> {
        const keys: string[] = [];
        const aliases: string[] = [];
        for (const asset of input) {
            if (asset.key) {
                keys.push(asset.key);
            } else if (asset.alias) {
                aliases.push(asset.alias);
            }
        }

        const assets: IResolvedAsset[] = [];
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
                sort: ["createdOn_ASC"],
                after
            });
        };

        let after: string | undefined = undefined;
        while (true) {
            /**
             * Unfortunately we must cast the result, because TS is not able to infer the correct type.
             */
            const { items, meta } = (await list(after)) as IListFilesCbResult;
            for (const file of items) {
                assets.push(createResolvedAsset(file));
            }
            if (!meta.hasMoreItems) {
                return assets;
            }
            after = meta.cursor || undefined;
        }
    }
}
