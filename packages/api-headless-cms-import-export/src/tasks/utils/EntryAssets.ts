import type { ContentEntryTraverser } from "@webiny/api-headless-cms";
import {
    IAsset,
    IAssets,
    IAssignAssetsInput,
    IEntryAssets
} from "~/tasks/utils/abstractions/EntryAssets";
import { matchKeyOrAlias } from "~/tasks/utils/helpers/matchKeyOrAlias";

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

    public assignAssets(input: IAssignAssetsInput): void {
        const entries = Array.isArray(input) ? input : [input];
        if (entries.length === 0) {
            return;
        }

        for (const entry of entries) {
            if (!entry?.values) {
                continue;
            }
            this.traverser.traverse(entry.values, ({ field, value }) => {
                if (!value || fileTypes.includes(field.type) === false) {
                    return;
                }

                this.assignAssetsToItems(value);
            });
        }
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

    private assignAssetsToItems(input: string | string[] | unknown): void {
        if (!input) {
            return;
        } else if (typeof input === "string") {
            const asset = this.parseAssetSrc(input);
            if (!asset) {
                return;
            } else if (this.assets[asset.url]) {
                return;
            }
            this.assets[asset.url] = asset;
            return;
        } else if (!Array.isArray(input)) {
            return;
        }
        for (const src of input) {
            const asset = this.parseAssetSrc(src);
            if (!asset) {
                continue;
            } else if (this.assets[asset.url]) {
                continue;
            }
            this.assets[asset.url] = asset;
        }
    }
}
