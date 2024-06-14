import { CmsEntry } from "@webiny/api-headless-cms/types";
import { ContentEntryTraverser } from "@webiny/api-headless-cms/utils/contentEntryTraverser/ContentEntryTraverser";

export interface IAsset {
    id?: string;
    key: string;
    path: string;
    url: string;
}

export type IAssets = Map<string, IAsset>;

export interface IEntryAssets {
    readonly assets: IAssets;
    assignAssets(entry: CmsEntry): void;
}

export interface IEntryAssetsParams {
    traverser: ContentEntryTraverser;
}

/**
 * This regexp creates a match group for the file path, file id, and file name.
 * Expected match.groups is IMatchedGroup type
 */
const assetSrcRegexp =
    /(?<filePath>\/files\/((?<fileId>[a-zA-Z0-9_-]+)\/)?(?<fileName>[a-zA-Z0-9_\-]+\.[a-z]{2,5}))$/;

type IMatchedGroup =
    | {
          filePath: string;
          fileId?: string;
          fileName: string;
      }
    | undefined;

export class EntryAssets implements IEntryAssets {
    public readonly assets: IAssets = new Map();
    private readonly traverser: ContentEntryTraverser;

    public constructor(params: IEntryAssetsParams) {
        this.traverser = params.traverser;
    }

    public assignAssets(entry: Pick<CmsEntry, "values">): void {
        this.traverser.traverse(entry.values, ({ field, value }) => {
            if (field.type !== "file" || !value) {
                return;
            }

            this.assignAssetsToItems(value);
        });
    }

    private parseAssetSrc(url?: string | unknown): IAsset | null {
        if (!url || typeof url !== "string") {
            return null;
        }
        const matched = url.match(assetSrcRegexp);
        const groups = matched?.groups as IMatchedGroup;
        if (!groups) {
            return null;
        }

        return {
            id: groups.fileId,
            path: groups.filePath,
            key: [groups.fileId, groups.fileName].filter(Boolean).join("/"),
            url
        };
    }

    private assignAssetsToItems(input: string | string[] | unknown): void {
        if (!input) {
            return;
        } else if (typeof input === "string") {
            const asset = this.parseAssetSrc(input);
            if (!asset) {
                return;
            } else if (this.assets.has(asset.key)) {
                return;
            }
            this.assets.set(asset.key, asset);
        } else if (!Array.isArray(input)) {
            return;
        }
        for (const src of input) {
            const asset = this.parseAssetSrc(src);
            if (!asset) {
                continue;
            } else if (this.assets.has(asset.key)) {
                continue;
            }
            this.assets.set(asset.key, asset);
        }
    }
}
