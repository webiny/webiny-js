import { createAbstraction } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { FileUrlGenerator } from "@webiny/api-file-manager/features/file/FileUrlGenerator/index.js";
import {
    assetKey,
    assetUrlKey,
    type MigratedAsset
} from "@webiny/api-component-extraction/domain/assets.js";

/**
 * Where a captured image URL ended up, once Capture migrated it into File Manager.
 *
 * Reads the same two keys Capture writes — a URL pointer to a content hash, and the hash to the file
 * — so there is one map and one writer of it rather than a second copy carried on the artifact. The
 * artifact route was the alternative and was not taken: the map is unbounded in the page count, and
 * an unbounded map on a DynamoDB artifact is the shape that broke the Generate aggregate against the
 * 400 KB item limit.
 *
 * Loaded once per compose and held for that pass. A site's pages share most of their images — a logo
 * on every page — so a per-binding read would ask the store the same question dozens of times for the
 * same answer.
 */
export interface IAssetUrlResolver {
    /** Load the map for the urls this compose will ask about. */
    prime(sourceUrls: Iterable<string>): Promise<void>;
    /** The migrated url for a captured url, or null when this migration has no copy. */
    resolve(sourceUrl: string): string | null;
}

export const AssetUrlResolver = createAbstraction<IAssetUrlResolver>(
    "PageCompositionPoc/AssetUrlResolver"
);
export namespace AssetUrlResolver {
    export type Interface = IAssetUrlResolver;
}

class AssetUrlResolverImpl implements IAssetUrlResolver {
    private urls = new Map<string, string | null>();

    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private fileUrlGenerator: FileUrlGenerator.Interface
    ) {}

    async prime(sourceUrls: Iterable<string>): Promise<void> {
        for (const sourceUrl of new Set(sourceUrls)) {
            if (this.urls.has(sourceUrl)) {
                continue;
            }
            this.urls.set(sourceUrl, await this.lookup(sourceUrl));
        }
    }

    resolve(sourceUrl: string): string | null {
        return this.urls.get(sourceUrl) ?? null;
    }

    private async lookup(sourceUrl: string): Promise<string | null> {
        const pointer = await this.read<{ sha256: string }>(assetUrlKey(sourceUrl));
        if (!pointer?.sha256) {
            return null;
        }
        const asset = await this.read<MigratedAsset>(assetKey(pointer.sha256));
        if (!asset?.fileKey) {
            return null;
        }
        return this.fileUrlGenerator.generateUrl({ key: asset.fileKey } as never);
    }

    private async read<T>(key: string): Promise<T | null> {
        const result = await this.keyValueStore.get<T>(key);
        if (result.isFail()) {
            // An absent key is "not migrated", which is a normal answer, not a failure.
            return null;
        }
        return result.value ?? null;
    }
}

export const AssetUrlResolverImplementation = AssetUrlResolver.createImplementation({
    implementation: AssetUrlResolverImpl,
    dependencies: [KeyValueStore, FileUrlGenerator]
});
