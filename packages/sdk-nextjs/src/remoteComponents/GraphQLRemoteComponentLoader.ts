import * as React from "react";
import type { Component } from "@webiny/website-builder-sdk";
import { ComponentsSdk } from "@webiny/sdk-frontend";
import * as sdkNextjs from "../index.js";

export interface GraphQLRemoteComponentLoaderConfig {
    apiHost: string;
    apiKey: string;
    apiTenant: string;
    locale?: string;
}

export class GraphQLRemoteComponentLoader {
    private config: GraphQLRemoteComponentLoaderConfig;
    private componentsSdk: ComponentsSdk;
    private cachedComponents: Component[] | null = null;
    private pendingLoad: Promise<Component[]> | null = null;

    constructor(config: GraphQLRemoteComponentLoaderConfig) {
        this.config = config;
        this.componentsSdk = new ComponentsSdk({
            endpoint: config.apiHost,
            token: config.apiKey,
            tenant: config.apiTenant
        });
    }

    async loadComponents(): Promise<Component[]> {
        if (this.cachedComponents) {
            return this.cachedComponents;
        }

        // Calls made while a load is in flight share it.
        if (!this.pendingLoad) {
            const load = this.fetchComponents();
            this.pendingLoad = load.finally(() => {
                this.pendingLoad = null;
            });
        }

        return this.pendingLoad;
    }

    private async fetchComponents(): Promise<Component[]> {
        const result = await this.componentsSdk.loadComponents({
            fetchOptions: { next: { revalidate: 60 } } as RequestInit
        });

        if (result.isFail()) {
            // Not cached, so the next call tries again.
            console.error(`[RemoteComponents] ${result.error.message}`);
            return [];
        }

        const entries = result.value;
        const bundled = entries.filter(entry => entry.bundledJs && entry.sdkVersion === "1");

        if (bundled.length === 0) {
            this.cachedComponents = [];
            return [];
        }

        const components: Component[] = [];
        for (const entry of bundled) {
            const hydrated = this.componentsSdk.hydrateComponent(
                entry,
                { sdk: sdkNextjs, React },
                {
                    tenantId: this.config.apiTenant,
                    locale: this.config.locale ?? "en-US",
                    mode: "server"
                }
            );
            if (hydrated) {
                components.push({
                    component: hydrated.component,
                    manifest: hydrated.manifest
                });
            }
        }

        this.cachedComponents = components;
        return components;
    }
}
