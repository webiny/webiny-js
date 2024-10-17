import type {
    File,
    FileListMeta,
    FileListWhereParams,
    FilesListOpts
} from "@webiny/api-file-manager/types";
import type { IEntryAssetsResolver, IResolvedAsset } from "./abstractions/EntryAssetsResolver";
import type { IAsset } from "./abstractions/EntryAssets";

export interface IFetchFilesCbResult {
    items: File[];
    meta: FileListMeta;
}

export interface IFetchFilesCb {
    (opts?: FilesListOpts): Promise<IFetchFilesCbResult>;
}

export interface IEntryAssetsResolverParams {
    fetchFiles: IFetchFilesCb;
}

const createResolvedAsset = (file: File): IResolvedAsset => {
    const result: IResolvedAsset = {
        ...file,
        aliases: file.aliases || []
    };
    /**
     * We need to remove unnecessary fields from the resolved assets.
     *
     * We cannot return specific fields, rather than deleting unnecessary ones, because a user can extend the file model
     * so we would not know which fields to return.
     */
    delete result.savedBy;
    delete result.savedOn;
    delete result.modifiedBy;
    delete result.modifiedOn;
    delete result.accessControl;
    delete result.createdBy;
    delete result.createdOn;
    delete result.tenant;
    delete result.locale;
    delete result.webinyVersion;

    return result;
};

export class EntryAssetsResolver implements IEntryAssetsResolver {
    private readonly fetchFiles: IFetchFilesCb;

    public constructor(params: IEntryAssetsResolverParams) {
        this.fetchFiles = params.fetchFiles;
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

        const fetch = async (after?: string) => {
            return this.fetchFiles({
                where,
                limit: 10000000,
                sort: ["id_ASC"],
                after
            });
        };

        let after: string | undefined = undefined;
        while (true) {
            /**
             * Unfortunately we must cast the result, because TS is not able to infer the correct type.
             */
            const { items, meta } = (await fetch(after)) as IFetchFilesCbResult;
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
