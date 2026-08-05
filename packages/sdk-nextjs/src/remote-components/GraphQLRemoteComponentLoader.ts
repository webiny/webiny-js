import type { Component } from "@webiny/website-builder-sdk";
import type { RemoteComponentBundleModule, RemoteRuntimeSdk } from "./types.js";
import { createServerSdk } from "./createServerSdk.js";

const LIST_REMOTE_COMPONENTS = /* GraphQL */ `
    query ListRemoteComponents {
        remoteComponents {
            listRemoteComponents {
                data {
                    id
                    name
                    label
                    bundledJs
                    bundledJsSha256
                    bundledCss
                    bundledCssSha256
                    sdkVersion
                    status
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

interface RemoteComponentEntry {
    id: string;
    name: string;
    label: string;
    bundledJs: string;
    bundledJsSha256: string;
    bundledCss: string;
    bundledCssSha256: string;
    sdkVersion: string;
    status: string;
}

interface ListRemoteComponentsResponse {
    remoteComponents: {
        listRemoteComponents: {
            data: RemoteComponentEntry[] | null;
            error: { code: string; message: string } | null;
        };
    };
}

export interface GraphQLRemoteComponentLoaderConfig {
    apiHost: string;
    apiKey: string;
    apiTenant: string;
    locale?: string;
}

function evalBundle(bundledJs: string): RemoteComponentBundleModule {
    const fn = new Function(`
        var __remoteComponent__;
        ${bundledJs}
        return __remoteComponent__;
    `);
    return fn() as RemoteComponentBundleModule;
}

export class GraphQLRemoteComponentLoader {
    private config: GraphQLRemoteComponentLoaderConfig;
    private cachedComponents: Component[] | null = null;
    private moduleCache = new Map<string, RemoteComponentBundleModule>();

    constructor(config: GraphQLRemoteComponentLoaderConfig) {
        this.config = config;
    }

    async loadComponents(): Promise<Component[]> {
        if (this.cachedComponents) {
            return this.cachedComponents;
        }

        const entries = await this.fetchRemoteComponents();

        const bundled = entries.filter(entry => entry.bundledJs && entry.sdkVersion === "1");

        if (bundled.length === 0) {
            this.cachedComponents = [];
            return [];
        }

        const sdk = createServerSdk({
            tenantId: this.config.apiTenant,
            locale: this.config.locale ?? "en-US"
        });

        const components: Component[] = [];
        for (const entry of bundled) {
            const component = this.loadComponentFromEntry(entry, sdk);
            if (component) {
                components.push(component);
            }
        }

        this.cachedComponents = components;
        return components;
    }

    private async fetchRemoteComponents(): Promise<RemoteComponentEntry[]> {
        const response = await fetch(`${this.config.apiHost}/graphql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Tenant": this.config.apiTenant,
                Authorization: "Bearer " + this.config.apiKey
            },
            body: JSON.stringify({ query: LIST_REMOTE_COMPONENTS }),
            next: { revalidate: 60 }
        } as RequestInit);

        if (!response.ok) {
            console.error(
                `[RemoteComponents] Failed to fetch remote components: HTTP ${response.status}`
            );
            return [];
        }

        const json = (await response.json()) as {
            data?: ListRemoteComponentsResponse;
            errors?: Array<{ message: string }>;
        };

        if (json.errors) {
            console.error(
                `[RemoteComponents] GraphQL errors:`,
                json.errors.map(e => e.message).join(", ")
            );
            return [];
        }

        const envelope = json.data?.remoteComponents?.listRemoteComponents;
        if (!envelope) {
            console.error(
                `[RemoteComponents] Unexpected response shape — is the remote-components API extension deployed?`
            );
            return [];
        }

        if (envelope.error) {
            console.error(`[RemoteComponents] GraphQL error: ${envelope.error.message}`);
            return [];
        }

        return envelope.data ?? [];
    }

    private loadComponentFromEntry(
        entry: RemoteComponentEntry,
        sdk: RemoteRuntimeSdk
    ): Component | null {
        const cacheKey = `${entry.id}:${entry.bundledJsSha256}`;

        let bundle = this.moduleCache.get(cacheKey);
        if (!bundle) {
            try {
                bundle = evalBundle(entry.bundledJs);
                this.moduleCache.set(cacheKey, bundle);
            } catch (error) {
                console.error(
                    `[RemoteComponents] Failed to eval component "${entry.name}":`,
                    error
                );
                return null;
            }
        }

        try {
            return bundle.createComponent(sdk);
        } catch (error) {
            console.error(`[RemoteComponents] Failed to create component "${entry.name}":`, error);
            return null;
        }
    }
}
