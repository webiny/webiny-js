import type { File } from "@webiny/api-file-manager/domain/file/types.js";
import type { IEntryAssetsResolver, IResolvedAsset } from "./abstractions/EntryAssetsResolver.js";
import type { IAsset } from "./abstractions/EntryAssets.js";

export interface IFetchFilesCbResult {
    items: File[];
    meta: Record<string, any>;
}

export interface IFetchFilesCb {
    (opts?: Record<string, any>): Promise<IFetchFilesCbResult>;
}

export interface IEntryAssetsResolverParams {
    fetchFiles: IFetchFilesCb;
}

const createResolvedAsset = (file: File): IResolvedAsset => {
    return {
        id: file.id,
        key: file.key,
        size: file.size,
        type: file.type,
        name: file.name,
        meta: file.meta,
        location: file.location,
        tags: file.tags,
        extensions: file.extensions
    };
};

export class EntryAssetsResolver implements IEntryAssetsResolver {
    private readonly fetchFiles: IFetchFilesCb;

    public constructor(params: IEntryAssetsResolverParams) {
        this.fetchFiles = params.fetchFiles;
    }

    public async resolve(input: IAsset[]): Promise<IResolvedAsset[]> {
        const keys: string[] = [];
        for (const asset of input) {
            if (asset.key) {
                keys.push(asset.key);
            }
        }

        const assets: IResolvedAsset[] = [];
        const where: Record<string, any> = {};
        if (keys.length > 0) {
            where.key_in = keys;
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
