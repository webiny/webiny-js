import type { ContentEntryTraverser } from "@webiny/api-headless-cms";
import { matchKeyOrAlias } from "~/tasks/utils/helpers/matchKeyOrAlias";
import { IAsset, IAssets, IAssignAssetsInput, IEntryAssets } from "./abstractions/EntryAssets";

export interface IEntryAssetsParams {
    traverser: ContentEntryTraverser;
}

const fileTypes: string[] = ["file"];

export class EntryAssets implements IEntryAssets {
    public readonly assets: IAssets = {};
    private readonly traverser: ContentEntryTraverser;

    public constructor(params: IEntryAssetsParams) {
        this.traverser = params.traverser;
    }

    public assignAssets(input: IAssignAssetsInput): IAsset[] {
        const entries = Array.isArray(input) ? input : [input];
        if (entries.length === 0) {
            return [];
        }

        const assets: IAsset[] = [];

        for (const entry of entries) {
            if (!entry?.values) {
                continue;
            }
            this.traverser.traverse(entry.values, ({ field, value }) => {
                if (!value || fileTypes.includes(field.type) === false) {
                    return;
                }

                assets.push(...this.assignAssetsToItems(value));
            });
        }
        return assets;
    }

    private parseAssetSrc(input?: string | unknown): IAsset | null {
        if (!input || typeof input !== "string" || !input.trim()) {
            return null;
        }

        const result = matchKeyOrAlias(input);
        if (!result) {
            return null;
        }
        return {
            ...result,
            url: input
        };
    }

    private assignAssetsToItems(input: string | string[] | unknown): IAsset[] {
        const assets: IAsset[] = [];
        if (!input) {
            return assets;
        }
        const inputArray: string[] = Array.isArray(input) ? input : [input];
        for (const src of inputArray) {
            const asset = this.parseAssetSrc(src);
            if (!asset) {
                continue;
            } else if (this.assets[asset.url]) {
                continue;
            }
            this.assets[asset.url] = asset;
            assets.push(asset);
        }
        return assets;
    }
}
