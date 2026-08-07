import type { Component } from "@webiny/website-builder-sdk";

export interface RemoteComponentManifest {
    schemaVersion: "1";
    packageId: string;
    version: string;
    sdkVersion: string;
    createdAt: string;
    components: RemoteComponentManifestEntry[];
    artifacts?: {
        css?: RemoteArtifact;
    };
}

export interface RemoteComponentManifestEntry {
    name: string;
    server: RemoteArtifact;
    browser?: RemoteArtifact;
}

export interface RemoteArtifact {
    url: string;
    sha256: string;
    size: number;
    contentType: string;
}

export interface RemoteComponentBundleModule {
    createComponent(sdk: RemoteRuntimeSdk): Component;
}

export interface RemoteRuntimeSdk {
    version: "1";
    dependencies: {
        sdk: typeof import("../index.js");
        React: typeof import("react");
    };
    environment: {
        tenantId: string;
        locale: string;
        mode: "server" | "browser";
    };
}

export interface RemoteComponentLoaderConfig {
    cacheDirectory: string;
    manifestTimeoutMs: number;
    serverBundleTimeoutMs: number;
    maximumServerBundleBytes: number;
    environment: {
        tenantId: string;
        locale: string;
    };
}

export type RemoteComponentLoaderOptions = Partial<RemoteComponentLoaderConfig>;
