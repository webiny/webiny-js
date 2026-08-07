import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Component } from "@webiny/website-builder-sdk";
import type {
    RemoteComponentManifest,
    RemoteComponentManifestEntry,
    RemoteComponentBundleModule,
    RemoteComponentLoaderConfig,
    RemoteComponentLoaderOptions
} from "./types.js";
import { RemoteComponentCache } from "./RemoteComponentCache.js";
import { createServerSdk } from "./createServerSdk.js";
import { fetchAndVerify } from "./verifyArtifact.js";
import {
    ManifestFetchError,
    ManifestValidationError,
    SdkVersionMismatchError,
    BundleImportError
} from "./errors.js";

const SUPPORTED_SDK_VERSION = "1";

const DEFAULT_CONFIG: RemoteComponentLoaderConfig = {
    cacheDirectory: path.join(os.tmpdir(), "webiny-remote-components"),
    manifestTimeoutMs: 2_000,
    serverBundleTimeoutMs: 5_000,
    maximumServerBundleBytes: 2_000_000,
    environment: {
        tenantId: "root",
        locale: "en-US"
    }
};

export class RemoteComponentLoader {
    private cache: RemoteComponentCache;
    private config: RemoteComponentLoaderConfig;

    constructor(options?: RemoteComponentLoaderOptions) {
        this.config = { ...DEFAULT_CONFIG, ...options };
        if (options && options.environment) {
            this.config.environment = { ...DEFAULT_CONFIG.environment, ...options.environment };
        }
        this.cache = new RemoteComponentCache();
    }

    async loadManifest(url: string): Promise<RemoteComponentManifest> {
        const cached = this.cache.getManifest(url);
        if (cached) {
            return cached;
        }

        let response: Response;
        try {
            response = await fetch(url, {
                signal: AbortSignal.timeout(this.config.manifestTimeoutMs)
            });
        } catch (error) {
            throw new ManifestFetchError(url, undefined, error as Error);
        }

        if (!response.ok) {
            throw new ManifestFetchError(url, response.status);
        }

        let manifest: RemoteComponentManifest;
        try {
            manifest = (await response.json()) as RemoteComponentManifest;
        } catch {
            throw new ManifestValidationError(url, "Invalid JSON.");
        }

        this.validateManifest(url, manifest);
        this.cache.setManifest(url, manifest);

        return manifest;
    }

    async loadComponents(manifestUrl: string): Promise<Component[]> {
        const cached = this.cache.getComponents(manifestUrl);
        if (cached) {
            return cached;
        }

        const manifest = await this.loadManifest(manifestUrl);

        if (manifest.sdkVersion !== SUPPORTED_SDK_VERSION) {
            throw new SdkVersionMismatchError(SUPPORTED_SDK_VERSION, manifest.sdkVersion);
        }

        const sdk = createServerSdk({
            tenantId: this.config.environment.tenantId,
            locale: this.config.environment.locale
        });

        const components = await Promise.all(
            manifest.components.map(entry => this.loadComponentBundle(manifest, entry, sdk))
        );

        this.cache.setComponents(manifestUrl, components);
        return components;
    }

    private async loadComponentBundle(
        manifest: RemoteComponentManifest,
        entry: RemoteComponentManifestEntry,
        sdk: ReturnType<typeof createServerSdk>
    ): Promise<Component> {
        const artifact = entry.server;
        const cacheKey = `${manifest.packageId}:${manifest.version}:${entry.name}:${artifact.sha256}`;

        const cached = this.cache.getModule(cacheKey);
        if (cached) {
            const bundle = await cached;
            return bundle.createComponent(sdk);
        }

        const loading = this.fetchVerifyAndImport(manifest, artifact);
        this.cache.setModule(cacheKey, loading);

        try {
            const bundle = await loading;
            return bundle.createComponent(sdk);
        } catch (error) {
            this.cache.deleteModule(cacheKey);
            throw error;
        }
    }

    private async fetchVerifyAndImport(
        manifest: RemoteComponentManifest,
        artifact: RemoteComponentManifestEntry["server"]
    ): Promise<RemoteComponentBundleModule> {
        const bytes = await fetchAndVerify({
            url: artifact.url,
            expectedSha256: artifact.sha256,
            timeoutMs: this.config.serverBundleTimeoutMs,
            maxBytes: this.config.maximumServerBundleBytes
        });

        const directory = path.join(
            this.config.cacheDirectory,
            manifest.packageId,
            manifest.version
        );
        const filename = path.join(directory, `${artifact.sha256}.mjs`);

        await mkdir(directory, { recursive: true });
        await writeFile(filename, bytes, { flag: "wx" }).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== "EEXIST") {
                throw error;
            }
        });

        try {
            return await (import(
                /* webpackIgnore: true */
                pathToFileURL(filename).href
            ) as Promise<RemoteComponentBundleModule>);
        } catch (error) {
            throw new BundleImportError(filename, error as Error);
        }
    }

    private validateManifest(url: string, manifest: RemoteComponentManifest): void {
        if (!manifest.schemaVersion) {
            throw new ManifestValidationError(url, "Missing schemaVersion.");
        }
        if (!manifest.packageId) {
            throw new ManifestValidationError(url, "Missing packageId.");
        }
        if (!manifest.version) {
            throw new ManifestValidationError(url, "Missing version.");
        }
        if (!manifest.sdkVersion) {
            throw new ManifestValidationError(url, "Missing sdkVersion.");
        }
        if (!Array.isArray(manifest.components) || manifest.components.length === 0) {
            throw new ManifestValidationError(url, "Missing or empty components array.");
        }
        for (const entry of manifest.components) {
            if (!entry.name) {
                throw new ManifestValidationError(url, "Component entry missing name.");
            }
            if (!entry.server || !entry.server.url || !entry.server.sha256) {
                throw new ManifestValidationError(
                    url,
                    `Component "${entry.name}" missing server artifact.`
                );
            }
        }
    }
}
