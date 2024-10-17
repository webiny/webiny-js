import type { IContentEntryTraverser } from "@webiny/api-headless-cms";
import { matchKeyOrAlias } from "~/tasks/utils/helpers/matchKeyOrAlias";
import type { IAsset, IAssignAssetsInput, IEntryAssets } from "./abstractions/EntryAssets";
import type { GenericRecord } from "@webiny/api/types";
import type { IUniqueResolver } from "~/tasks/utils/uniqueResolver/abstractions/UniqueResolver";

export interface IEntryAssetsParams {
    traverser: IContentEntryTraverser;
    uniqueResolver: IUniqueResolver<IAsset>;
}

const fileTypes: string[] = ["file"];

export class EntryAssets implements IEntryAssets {
    private readonly uniqueResolver: IUniqueResolver<IAsset>;

    private readonly traverser: IContentEntryTraverser;

    public constructor(params: IEntryAssetsParams) {
        this.traverser = params.traverser;
        this.uniqueResolver = params.uniqueResolver;
    }

    public async assignAssets(input: IAssignAssetsInput): Promise<IAsset[]> {
        const entries = Array.isArray(input) ? input : [input];
        if (entries.length === 0) {
            return [];
        }

        const assets: IAsset[] = [];

        for (const entry of entries) {
            if (!entry?.values) {
                continue;
            }
            await this.traverser.traverse(entry.values, ({ field, value }) => {
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
        const assets: GenericRecord<string, IAsset> = {};
        if (!input) {
            return [];
        }
        const inputArray: string[] = Array.isArray(input) ? input : [input];
        for (const src of inputArray) {
            const asset = this.parseAssetSrc(src);
            if (!asset) {
                continue;
            } else if (assets[asset.url]) {
                continue;
            }
            assets[asset.url] = asset;
        }
        return this.uniqueResolver.resolve(Object.values(assets), "url");
    }
}
