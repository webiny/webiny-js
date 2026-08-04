import type { Component } from "@webiny/website-builder-sdk";
import type { RemoteComponentManifest, RemoteComponentBundleModule } from "./types.js";

interface CachedManifest {
    manifest: RemoteComponentManifest;
    expiresAt: number;
}

const DEFAULT_MANIFEST_TTL_MS = 60_000;

export class RemoteComponentCache {
    private manifests = new Map<string, CachedManifest>();
    private modules = new Map<string, Promise<RemoteComponentBundleModule>>();
    private components = new Map<string, Component[]>();

    getManifest(url: string): RemoteComponentManifest | null {
        const entry = this.manifests.get(url);
        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.manifests.delete(url);
            return null;
        }

        return entry.manifest;
    }

    setManifest(url: string, manifest: RemoteComponentManifest, ttlMs?: number): void {
        this.manifests.set(url, {
            manifest,
            expiresAt: Date.now() + (ttlMs ?? DEFAULT_MANIFEST_TTL_MS)
        });
    }

    getModule(key: string): Promise<RemoteComponentBundleModule> | null {
        return this.modules.get(key) ?? null;
    }

    setModule(key: string, modulePromise: Promise<RemoteComponentBundleModule>): void {
        this.modules.set(key, modulePromise);
    }

    deleteModule(key: string): void {
        this.modules.delete(key);
    }

    getComponents(manifestUrl: string): Component[] | null {
        return this.components.get(manifestUrl) ?? null;
    }

    setComponents(manifestUrl: string, components: Component[]): void {
        this.components.set(manifestUrl, components);
    }
}
