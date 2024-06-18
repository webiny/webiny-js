import type { ContentEntryTraverser } from "@webiny/api-headless-cms";
import {
    IAsset,
    IAssets,
    IAssignAssetsInput,
    IEntryAssets
} from "~/tasks/utils/abstractions/EntryAssets";

export interface IEntryAssetsParams {
    traverser: ContentEntryTraverser;
}

const fileTypes: string[] = ["file"];

interface IMatchOutput {
    alias?: never;
    key: string;
}

interface IMatchAliasOutput {
    key?: never;
    alias: string;
}

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
            this.traverser.traverse(entry.values, ({ field, value }) => {
                if (!value || fileTypes.includes(field.type) === false) {
                    return;
                }

                this.assignAssetsToItems(value);
            });
        }
    }

    private parseAssetSrc(input?: string | unknown): IAsset | null {
        if (!input || typeof input !== "string") {
            return null;
        }

        const result = this.match(input);
        if (!result) {
            return null;
        }

        return {
            ...result,
            url: input
        };
    }

    private match(input: string): IMatchAliasOutput | IMatchOutput | null {
        const url = new URL(input);
        const { pathname } = url;
        const isAlias = !pathname.startsWith("/files/") && !pathname.startsWith("/private/");
        if (isAlias) {
            return {
                alias: pathname
            };
        }
        return {
            key: pathname.replace("/files/", "").replace("/private/", "")
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
