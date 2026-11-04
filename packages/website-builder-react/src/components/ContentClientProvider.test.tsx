import React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    componentRegistry,
    contentSdk,
    createContentClient,
    type Component,
    type ComponentLoaderFactory,
    type Document,
    type ElementComponent
} from "@webiny/website-builder-sdk";
import { ContentClientProvider } from "./ContentClientProvider.js";
import { DocumentRenderer } from "./DocumentRenderer.js";

const componentLabels: Record<string, string> = {
    "tenant-a": "Hero from tenant A",
    "tenant-b": "Hero from tenant B"
};

const createBlueprint = (name: string, label: string): Component => {
    const Hero = () => <span>{label}</span>;
    return { component: Hero, manifest: { name, inputs: [], tags: [] } };
};

const createDocument = (componentName: string): Document => {
    return {
        id: "page-1",
        version: 1,
        state: {},
        properties: { id: "page-1", path: "/" },
        extensions: {},
        metadata: {} as Document["metadata"],
        bindings: {},
        elements: {
            root: {
                type: "Webiny/Element",
                id: "root",
                component: { name: componentName }
            }
        }
    };
};

// Fetches the component through the client's own API client, so it reaches the client's tenant.
const tenantComponentLoader: ComponentLoaderFactory = ({ apiClient }) => {
    return {
        async loadComponent(ref: ElementComponent) {
            const data = await apiClient.query({
                query: "query LoadComponent($name: String!) { component(name: $name) { label } }",
                variables: { name: ref.name }
            });
            return createBlueprint(ref.name, data.component.label);
        }
    };
};

describe("ContentClientProvider", () => {
    beforeEach(() => {
        const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
            const headers = init.headers as Record<string, string>;
            const tenant = headers["X-Tenant"];

            // Tenant A answers last, so the two requests interleave.
            const delay = tenant === "tenant-a" ? 20 : 0;
            await new Promise(resolve => setTimeout(resolve, delay));

            return {
                json: async () => ({ data: { component: { label: componentLabels[tenant] } } })
            };
        });

        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("renders each tenant's same-name component through its own client, concurrently", async () => {
        const document = createDocument("Acme/Hero");

        const renderFor = async (tenant: string) => {
            const client = createContentClient({
                apiHost: `https://${tenant}.example.com`,
                apiKey: `key-${tenant}`,
                apiTenant: tenant,
                componentLoader: tenantComponentLoader
            });
            await client.loadDocumentComponents(document);

            return renderToString(
                <ContentClientProvider client={client}>
                    <DocumentRenderer document={document} components={[]} />
                </ContentClientProvider>
            );
        };

        const [htmlA, htmlB] = await Promise.all([renderFor("tenant-a"), renderFor("tenant-b")]);

        expect(htmlA).toContain("Hero from tenant A");
        expect(htmlA).not.toContain("Hero from tenant B");
        expect(htmlB).toContain("Hero from tenant B");
        expect(htmlB).not.toContain("Hero from tenant A");
        expect(componentRegistry.get("Acme/Hero")).toBeUndefined();
    });

    it("uses the contentSdk singleton without a provider, as before", () => {
        contentSdk.init({
            apiHost: "https://root.example.com",
            apiKey: "key-root",
            apiTenant: "root"
        });
        const document = createDocument("Acme/SingletonHero");

        const html = renderToString(
            <DocumentRenderer
                document={document}
                components={[createBlueprint("Acme/SingletonHero", "Singleton hero")]}
            />
        );

        expect(html).toContain("Singleton hero");
        expect(componentRegistry.get("Acme/SingletonHero")).toBeDefined();
        expect(contentSdk.getDocumentStoreManager().hasStore("page-1")).toBe(true);
    });

    it("doesn't render the singleton's components inside a provider", () => {
        contentSdk.init({
            apiHost: "https://root.example.com",
            apiKey: "key-root",
            apiTenant: "root"
        });
        contentSdk.registerComponent(createBlueprint("Acme/SingletonHero", "Singleton hero"));
        const client = createContentClient({
            apiHost: "https://a.example.com",
            apiKey: "key-a",
            apiTenant: "tenant-a"
        });
        const document = createDocument("Acme/SingletonHero");

        const html = renderToString(
            <ContentClientProvider client={client}>
                <DocumentRenderer document={document} components={[]} />
            </ContentClientProvider>
        );

        expect(html).not.toContain("Singleton hero");
    });
});
