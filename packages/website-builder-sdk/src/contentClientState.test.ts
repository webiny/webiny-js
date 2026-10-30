import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createContentClient } from "./createContentClient.js";
import { ContentSdk, contentSdk } from "./ContentSdk.js";
import type { ContentSDKConfig } from "./ContentSdk.js";
import { componentRegistry } from "./ComponentRegistry.js";
import { contentEntryCache } from "./contentEntry/ContentEntryCache.js";
import { documentStoreManager } from "./DocumentStoreManager.js";
import { DocumentStoreManager } from "./DocumentStoreManager.js";
import { DEFAULT_MAX_DOCUMENT_STORES } from "./DocumentStoreManager.js";
import type { ComponentLoader } from "./componentLoader/ComponentLoader.js";
import type { Component, Document, ElementComponent } from "./types.js";
import { resolveVisitorContext } from "./experiments/render.js";
import { setHeadersProvider } from "./headersProvider.js";
import { setDefaultComponentLoader } from "./componentLoader/defaultComponentLoader.js";

// What the stubbed API returns for a component, per tenant.
const componentLabels: Record<string, string> = {
    "tenant-a": "Hero from tenant A",
    "tenant-b": "Hero from tenant B"
};

const configFor = (tenant: string): ContentSDKConfig => {
    return {
        apiHost: `https://${tenant}.example.com`,
        apiKey: `key-${tenant}`,
        apiTenant: tenant
    };
};

const createBlueprint = (name: string, label: string): Component => {
    return {
        component: () => label,
        manifest: {
            name,
            label,
            inputs: [
                {
                    type: "contentEntry",
                    name: "entry",
                    renderer: "Webiny/ContentEntry",
                    models: ["article"]
                }
            ],
            tags: []
        }
    };
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

// A loader that fetches the component through the client's own API client.
const tenantComponentLoader: NonNullable<ContentSDKConfig["componentLoader"]> = ({ apiClient }) => {
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

const resolveLabel = (client: Pick<ContentSdk, "resolveElement">, document: Document) => {
    const resolved = client.resolveElement({
        element: document.elements.root,
        elementBindings: {},
        state: document.state
    });
    if (!resolved) {
        return null;
    }
    return { label: resolved[0].manifest.label, entry: resolved[0].inputs.entry };
};

describe("content client state", () => {
    let requestedTenants: string[];
    let requestedPageIds: Record<string, string[]>;

    beforeEach(() => {
        requestedTenants = [];
        requestedPageIds = {};

        const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
            const headers = init.headers as Record<string, string>;
            const tenant = headers["X-Tenant"];
            const body = JSON.parse(init.body as string);
            requestedTenants.push(tenant);

            // Tenant A answers last, so the two loads interleave.
            const delay = tenant === "tenant-a" ? 20 : 0;
            await new Promise(resolve => setTimeout(resolve, delay));

            if (body.query.includes("getPageById")) {
                const id: string = body.variables.id;
                requestedPageIds[tenant] = [...(requestedPageIds[tenant] ?? []), id];
                const page = { id, properties: { id, path: "/", title: `Draft of ${tenant}` } };
                return {
                    json: async () => ({
                        data: { websiteBuilder: { getPageById: { data: page, error: null } } }
                    })
                };
            }

            return {
                json: async () => ({ data: { component: { label: componentLabels[tenant] } } })
            };
        });

        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("resolves same-name components and entries per client, concurrently", async () => {
        const name = "Acme/Hero";
        const document = createDocument(name);

        const clientA = createContentClient({
            ...configFor("tenant-a"),
            componentLoader: tenantComponentLoader
        });
        const clientB = createContentClient({
            ...configFor("tenant-b"),
            componentLoader: tenantComponentLoader
        });

        clientA.getContentEntryCache().set("root:entry", { id: "entry-a" });
        clientB.getContentEntryCache().set("root:entry", { id: "entry-b" });

        const render = async (client: typeof clientA) => {
            await client.loadDocumentComponents(document);
            return resolveLabel(client, document);
        };

        const [resultA, resultB] = await Promise.all([render(clientA), render(clientB)]);

        expect(requestedTenants.sort()).toEqual(["tenant-a", "tenant-b"]);
        expect(resultA).toEqual({ label: "Hero from tenant A", entry: { id: "entry-a" } });
        expect(resultB).toEqual({ label: "Hero from tenant B", entry: { id: "entry-b" } });

        // Nothing reached the singleton's state.
        expect(componentRegistry.get(name)).toBeUndefined();
        expect(contentEntryCache.has("root:entry")).toBe(false);
    });

    it("keeps the singleton and clients apart, and init() doesn't touch clients", () => {
        const name = "Acme/SingletonOnly";
        const client = createContentClient(configFor("tenant-a"));

        contentSdk.init(configFor("tenant-root"));
        contentSdk.registerComponent(createBlueprint(name, "Singleton component"));

        expect(componentRegistry.get(name)).toBeDefined();
        expect(client.getComponentRegistry().get(name)).toBeUndefined();
        expect(resolveLabel(client, createDocument(name))).toBeNull();

        client.registerComponent(createBlueprint("Acme/ClientOnly", "Client component"));
        expect(componentRegistry.get("Acme/ClientOnly")).toBeUndefined();

        contentSdk.init(configFor("tenant-other"));
        expect(client.getComponentRegistry().get("Acme/ClientOnly")).toBeDefined();
        expect(resolveLabel(contentSdk, createDocument(name))?.label).toBe("Singleton component");
    });

    it("uses the module-level state for contentSdk and a plain new ContentSdk(), as before", () => {
        const sdk = new ContentSdk();

        expect(contentSdk.getComponentRegistry()).toBe(componentRegistry);
        expect(contentSdk.getContentEntryCache()).toBe(contentEntryCache);
        expect(contentSdk.getDocumentStoreManager()).toBe(documentStoreManager);
        expect(sdk.getComponentRegistry()).toBe(componentRegistry);
        expect(sdk.getContentEntryCache()).toBe(contentEntryCache);
        expect(sdk.getDocumentStoreManager()).toBe(documentStoreManager);

        const client = createContentClient(configFor("tenant-a"));
        expect(client.getComponentRegistry()).not.toBe(componentRegistry);
        expect(client.getContentEntryCache()).not.toBe(contentEntryCache);
        expect(client.getDocumentStoreManager()).not.toBe(documentStoreManager);
    });

    it("still requires init() on the singleton path", () => {
        const sdk = new ContentSdk();
        expect(() => sdk.registerComponent(createBlueprint("Acme/X", "X"))).toThrow(
            "ContentSdk has not been initialized!"
        );
    });

    it("calls a custom loader with the refs of unregistered components only", async () => {
        const refs: ElementComponent[] = [];
        const loader: ComponentLoader = {
            async loadComponent(ref) {
                refs.push(ref);
                return createBlueprint(ref.name, `Loaded ${ref.name}`);
            }
        };

        const client = createContentClient({
            ...configFor("tenant-a"),
            componentLoader: () => loader
        });
        client.registerComponent(createBlueprint("Acme/Registered", "Registered"));

        const document = createDocument("Acme/Remote");
        document.elements.second = {
            type: "Webiny/Element",
            id: "second",
            component: { name: "Acme/Registered" }
        };
        document.elements.third = {
            type: "Webiny/Element",
            id: "third",
            component: { name: "Acme/Remote" }
        };

        await client.loadDocumentComponents(document);
        expect(refs).toEqual([{ name: "Acme/Remote" }]);
        expect(resolveLabel(client, document)?.label).toBe("Loaded Acme/Remote");

        // Registered now, so the loader isn't asked again.
        await client.loadDocumentComponents(document);
        expect(refs).toHaveLength(1);
    });

    it("uses the default loader, created per client with its own config", async () => {
        const tenants: string[] = [];
        setDefaultComponentLoader(({ config }) => {
            tenants.push(config.apiTenant);
            return {
                async loadComponent(ref) {
                    return createBlueprint(ref.name, `Default for ${config.apiTenant}`);
                }
            };
        });

        try {
            const document = createDocument("Acme/FromDefault");
            const clientA = createContentClient(configFor("tenant-a"));
            const clientB = createContentClient(configFor("tenant-b"));

            await Promise.all([
                clientA.loadDocumentComponents(document),
                clientB.loadDocumentComponents(document)
            ]);

            expect(tenants.sort()).toEqual(["tenant-a", "tenant-b"]);
            expect(resolveLabel(clientA, document)?.label).toBe("Default for tenant-a");
            expect(resolveLabel(clientB, document)?.label).toBe("Default for tenant-b");
        } finally {
            setDefaultComponentLoader(undefined);
        }
    });

    it("prefers the client's own loader over the default", async () => {
        const defaultLoad = vi.fn();
        setDefaultComponentLoader(() => ({ loadComponent: defaultLoad }));

        try {
            const client = createContentClient({
                ...configFor("tenant-a"),
                componentLoader: () => ({
                    async loadComponent(ref) {
                        return createBlueprint(ref.name, "Own loader");
                    }
                })
            });
            const document = createDocument("Acme/Own");

            await client.loadDocumentComponents(document);

            expect(defaultLoad).not.toHaveBeenCalled();
            expect(resolveLabel(client, document)?.label).toBe("Own loader");
        } finally {
            setDefaultComponentLoader(undefined);
        }
    });

    it("fetches preview pages through each client, with the client's preview headers", async () => {
        const previewClient = (tenant: string, pageId: string) => {
            return createContentClient({
                ...configFor(tenant),
                preview: true,
                headersProvider: async () =>
                    new Headers({ "X-Preview-Params": `wb.type=page&wb.path=/&wb.id=${pageId}` })
            });
        };
        const clientA = previewClient("tenant-a", "draft-a");
        const clientB = previewClient("tenant-b", "draft-b");

        const [pageA, pageB] = await Promise.all([clientA.getPage("/"), clientB.getPage("/")]);

        expect(clientA.isPreviewing()).toBe(true);
        expect(requestedPageIds).toEqual({ "tenant-a": ["draft-a"], "tenant-b": ["draft-b"] });
        expect(pageA?.properties.title).toBe("Draft of tenant-a");
        expect(pageB?.properties.title).toBe("Draft of tenant-b");
    });

    it("falls back to the global headers provider for preview, as before", async () => {
        setHeadersProvider(
            async () =>
                new Headers({ "X-Preview-Params": "wb.type=page&wb.path=/&wb.id=draft-global" })
        );
        const client = createContentClient({ ...configFor("tenant-b"), preview: true });

        const page = await client.getPage("/");

        expect(requestedPageIds).toEqual({ "tenant-b": ["draft-global"] });
        expect(page?.properties.title).toBe("Draft of tenant-b");
    });

    it("loads nothing without a loader or a default", async () => {
        const client = createContentClient(configFor("tenant-a"));
        const document = createDocument("Acme/Unknown");

        await client.loadDocumentComponents(document);

        expect(requestedTenants).toEqual([]);
        expect(resolveLabel(client, document)).toBeNull();
    });

    it("bounds the document stores and evicts the least recently used one", () => {
        const stores = new DocumentStoreManager({ maxEntries: 2 });
        const first = stores.getStore("a");
        stores.getStore("b");

        // Touch "a", so "b" is now the least recently used.
        expect(stores.getStore("a")).toBe(first);
        stores.getStore("c");

        expect(stores.hasStore("a")).toBe(true);
        expect(stores.hasStore("b")).toBe(false);
        expect(stores.hasStore("c")).toBe(true);
        expect(stores.getStores().size).toBe(2);

        stores.clear();
        expect(stores.getStores().size).toBe(0);
    });

    it("keeps every store below the default bound", () => {
        const stores = new DocumentStoreManager();
        for (let i = 0; i < 1000; i++) {
            stores.getStore(`page-${i}`);
        }
        expect(stores.getStores().size).toBe(1000);
        expect(DEFAULT_MAX_DOCUMENT_STORES).toBe(10_000);
    });

    it("reads request headers from the client's provider, else the global one", async () => {
        setHeadersProvider(async () => new Headers({ cookie: "wb_ab_vid=global-visitor" }));

        const fromGlobal = await resolveVisitorContext();
        expect(fromGlobal.context.visitorId).toBe("global-visitor");

        const fromOption = await resolveVisitorContext({
            headersProvider: async () => new Headers({ cookie: "wb_ab_vid=client-visitor" })
        });
        expect(fromOption.context.visitorId).toBe("client-visitor");
    });
});
