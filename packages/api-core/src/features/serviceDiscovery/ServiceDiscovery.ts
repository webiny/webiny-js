import type { GenericRecord } from "@webiny/api/types.js";

export interface IServiceManifest {
    name: string;
    manifest: GenericRecord<string>;
}

export interface IServiceManifestLoader {
    load(): Promise<IServiceManifest[] | undefined>;
}

type Manifest = GenericRecord<string>;

export class ServiceDiscovery {
    private static loader: IServiceManifestLoader | undefined;
    private static manifest: Manifest | undefined;

    static setLoader(loader: IServiceManifestLoader): void {
        this.loader = loader;
    }

    static async load(): Promise<Manifest | undefined> {
        if (this.manifest) {
            return this.manifest;
        }

        if (!this.loader) {
            throw new Error(
                "ServiceDiscovery loader not configured. Call ServiceDiscovery.setLoader() before loading manifests."
            );
        }

        const manifests = await this.loader.load();

        if (!manifests) {
            return undefined;
        }

        this.manifest = manifests.reduce<Manifest>((acc, item) => {
            return { ...acc, [item.name]: item.manifest };
        }, {});

        return this.manifest;
    }

    static clear(): void {
        this.manifest = undefined;
    }
}
