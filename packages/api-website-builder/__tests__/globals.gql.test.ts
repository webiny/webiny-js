import type { Container } from "@webiny/di";
import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { GlobalComponentModelProvider } from "~/domain/globals/abstractions.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import {
    GlobalComponentAfterSaveEventHandler,
    GlobalComponentBeforeSaveEventHandler
} from "~/features/globals/SaveGlobalComponent/index.js";
import { SaveGlobalComponentRepository } from "~/features/globals/SaveGlobalComponent/abstractions.js";
import { GetGlobalComponentRepository } from "~/features/globals/GetGlobalComponent/abstractions.js";
import { ListGlobalComponentsRepository } from "~/features/globals/ListGlobalComponents/abstractions.js";

// Pages with a language take the languages extension.
const createLanguagesPlugin = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        LanguagesExtension.register(context.container);
    });
    plugin.name = "test-languages-extension-plugin";
    return plugin;
};

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
    }
`;

const GLOBAL_COMPONENT_FIELDS = /* GraphQL */ `
    data {
        name
        language
        elements
        bindings
    }
`;

const GET_GLOBAL_COMPONENT = /* GraphQL */ `
    query GetGlobalComponent($name: String!, $language: String) {
        websiteBuilder {
            getGlobalComponent(name: $name, language: $language) {
                ${GLOBAL_COMPONENT_FIELDS}
                ${ERROR_FIELDS}
            }
        }
    }
`;

const LIST_GLOBAL_COMPONENTS = /* GraphQL */ `
    query ListGlobalComponents($language: String, $fallback: Boolean) {
        websiteBuilder {
            listGlobalComponents(language: $language, fallback: $fallback) {
                ${GLOBAL_COMPONENT_FIELDS}
                ${ERROR_FIELDS}
            }
        }
    }
`;

const SAVE_GLOBAL_COMPONENT = /* GraphQL */ `
    mutation SaveGlobalComponent($name: String!, $language: String, $data: WbGlobalComponentInput!) {
        websiteBuilder {
            saveGlobalComponent(name: $name, language: $language, data: $data) {
                ${GLOBAL_COMPONENT_FIELDS}
                ${ERROR_FIELDS}
            }
        }
    }
`;

const createGlobal = (name: string, title: string) => {
    const id = `$global:${name}`;
    return {
        elements: {
            [id]: { type: "Webiny/Element", id, component: { name } }
        },
        bindings: {
            [id]: {
                inputs: { title: { id: "b1", type: "text", static: title } },
                styles: {},
                overrides: {}
            }
        }
    };
};

const pageContent = {
    elements: {
        root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } }
    },
    bindings: {
        root: { inputs: {}, styles: {}, overrides: {} }
    }
};

const sortByName = (items: { name: string }[]) => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
};

describe("Global components GraphQL", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    const getGlobalComponent = async (
        name: string,
        h = handler,
        language: string | null = null
    ) => {
        const [response] = await h.invoke({
            body: { query: GET_GLOBAL_COMPONENT, variables: { name, language } }
        });
        return response.data.websiteBuilder.getGlobalComponent;
    };

    const listGlobalComponents = async (
        h = handler,
        language: string | null = null,
        fallback?: boolean
    ) => {
        const [response] = await h.invoke({
            body: { query: LIST_GLOBAL_COMPONENTS, variables: { language, fallback } }
        });
        return response.data.websiteBuilder.listGlobalComponents;
    };

    const saveGlobalComponent = async (
        name: string,
        data: any,
        h = handler,
        language: string | null = null
    ) => {
        const [response] = await h.invoke({
            body: { query: SAVE_GLOBAL_COMPONENT, variables: { name, language, data } }
        });
        return response.data.websiteBuilder.saveGlobalComponent;
    };

    const createPage = async (properties: Record<string, any> = {}) => {
        const [response] = await handler.wb.createPage({
            data: {
                ...pageMocks.pageA,
                ...pageContent,
                properties: { ...pageMocks.pageA.properties, ...properties }
            }
        });
        return response.data.websiteBuilder.createPage.data;
    };

    const getDeliveredTitle = async (pageId: string) => {
        const [response] = await handler.wb.getPageById({ id: pageId });
        const page = response.data.websiteBuilder.getPageById.data;
        return page.bindings["$global:Demo/Header"]?.inputs.title.static ?? null;
    };

    const createLanguage = async (code: string, isDefault: boolean) => {
        const context = await useHandler({}).handler();
        const model = await context.container.resolve(GetModelUseCase).execute("wbyLanguage");
        if (model.isFail()) {
            throw model.error;
        }

        const result = await context.container.resolve(CreateEntryUseCase).execute(model.value, {
            values: { name: code, code, direction: "ltr", isDefault, enabled: true }
        });
        if (result.isFail()) {
            throw result.error;
        }
    };

    beforeEach(async () => {
        handler = useGraphQlHandler({ plugins: [createLanguagesPlugin()] });
    });

    it("returns nothing for global components that were never saved", async () => {
        expect(await getGlobalComponent("Demo/Header")).toEqual({
            data: null,
            error: {
                code: "WebsiteBuilder/GlobalComponent/NotFound",
                message: `Global component "Demo/Header" in language "default" was not found!`
            }
        });
        expect(await listGlobalComponents()).toEqual({ data: [], error: null });
    });

    it("stores each global component as its own record", async () => {
        const header = createGlobal("Demo/Header", "Welcome");
        const footer = createGlobal("Demo/Footer", "Bye");

        const savedHeader = await saveGlobalComponent("Demo/Header", header);
        expect(savedHeader).toEqual({
            data: { name: "Demo/Header", language: "default", ...header },
            error: null
        });

        await saveGlobalComponent("Demo/Footer", footer);

        // Saving the header again replaces its record and keeps the footer as it is.
        const updatedHeader = createGlobal("Demo/Header", "Hello");
        await saveGlobalComponent("Demo/Header", updatedHeader);

        const header2 = await getGlobalComponent("Demo/Header");
        expect(header2).toEqual({
            data: { name: "Demo/Header", language: "default", ...updatedHeader },
            error: null
        });

        const list = await listGlobalComponents();
        expect(list.error).toBeNull();
        expect(sortByName(list.data)).toEqual([
            { name: "Demo/Footer", language: "default", ...footer },
            { name: "Demo/Header", language: "default", ...updatedHeader }
        ]);
    });

    it("rejects a global whose elements or bindings are not objects", async () => {
        const result = await saveGlobalComponent("Demo/Header", { elements: "x", bindings: {} });

        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WebsiteBuilder/GlobalComponent/ValidationError");
        expect(await listGlobalComponents()).toEqual({ data: [], error: null });
    });

    it("rejects a global without its own `$global:{name}` element", async () => {
        const result = await saveGlobalComponent("Demo/Header", createGlobal("Demo/Footer", "Bye"));

        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WebsiteBuilder/GlobalComponent/ValidationError");
        expect(await listGlobalComponents()).toEqual({ data: [], error: null });
    });

    it("rejects a global holding elements or bindings outside its own tree", async () => {
        const header = createGlobal("Demo/Header", "Welcome");
        const footer = createGlobal("Demo/Footer", "Bye");

        const withPageRoot = await saveGlobalComponent("Demo/Header", {
            elements: { ...header.elements, ...pageContent.elements },
            bindings: { ...header.bindings, ...pageContent.bindings }
        });
        expect(withPageRoot.data).toBeNull();
        expect(withPageRoot.error.code).toBe("WebsiteBuilder/GlobalComponent/ValidationError");

        const withOtherGlobal = await saveGlobalComponent("Demo/Header", {
            elements: { ...header.elements, ...footer.elements },
            bindings: header.bindings
        });
        expect(withOtherGlobal.error.code).toBe("WebsiteBuilder/GlobalComponent/ValidationError");

        const withStrayBinding = await saveGlobalComponent("Demo/Header", {
            elements: header.elements,
            bindings: { ...header.bindings, root: pageContent.bindings.root }
        });
        expect(withStrayBinding.error.code).toBe("WebsiteBuilder/GlobalComponent/ValidationError");

        expect(await listGlobalComponents()).toEqual({ data: [], error: null });
    });

    it("accepts elements nested inside the global", async () => {
        const header = createGlobal("Demo/Header", "Welcome");
        const data = {
            elements: {
                ...header.elements,
                logo: {
                    type: "Webiny/Element",
                    id: "logo",
                    component: { name: "Demo/Logo" },
                    parent: { id: "$global:Demo/Header", slot: "children" }
                }
            },
            bindings: { ...header.bindings, logo: { inputs: {}, styles: {}, overrides: {} } }
        };

        const result = await saveGlobalComponent("Demo/Header", data);
        expect(result).toEqual({
            data: { name: "Demo/Header", language: "default", ...data },
            error: null
        });
    });

    it("keeps one record per global across first saves made at the same time", async () => {
        await Promise.all([
            saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "One")),
            saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "Two"))
        ]);

        const list = await listGlobalComponents();
        expect(list.error).toBeNull();
        expect(list.data).toHaveLength(1);
    });

    it("lists only the record at a global's own entry id", async () => {
        // A stray record for the same global, e.g. one stored before records had a fixed entry id.
        const context = await useHandler({}).handler();
        const created = await context.container
            .resolve(CreateEntryUseCase)
            .execute(await context.container.resolve(GlobalComponentModelProvider).get(), {
                values: { name: "Demo/Header", ...createGlobal("Demo/Header", "Stray") }
            });
        expect(created.isOk()).toBe(true);

        const header = createGlobal("Demo/Header", "Welcome");
        await saveGlobalComponent("Demo/Header", header);

        expect(await listGlobalComponents()).toEqual({
            data: [{ name: "Demo/Header", language: "default", ...header }],
            error: null
        });
    });

    it("delivers pages with the stored global components merged in", async () => {
        const page = await createPage();
        const header = createGlobal("Demo/Header", "Welcome");
        await saveGlobalComponent("Demo/Header", header);

        const [byId] = await handler.wb.getPageById({ id: page.id });
        const pageById = byId.data.websiteBuilder.getPageById.data;
        expect(pageById.elements).toEqual({ ...pageContent.elements, ...header.elements });
        expect(pageById.bindings).toEqual({ ...pageContent.bindings, ...header.bindings });

        await handler.wb.publishPage({ id: page.id });
        const [byPath] = await handler.wb.getPageByPath({
            path: pageMocks.pageA.properties.path
        });
        const pageByPath = byPath.data.websiteBuilder.getPageByPath.data;
        expect(pageByPath.elements).toEqual({ ...pageContent.elements, ...header.elements });
        expect(pageByPath.bindings).toEqual({ ...pageContent.bindings, ...header.bindings });

        // Saved once, it shows on every page: a second page gets it too, and the next save as well.
        const second = await createPage({ path: "/second-page" });
        expect(await getDeliveredTitle(second.id)).toBe("Welcome");
        await saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "Hello"));
        expect(await getDeliveredTitle(page.id)).toBe("Hello");
        expect(await getDeliveredTitle(second.id)).toBe("Hello");
    });

    it("never stores global instance elements in a page, but keeps the page's overrides", async () => {
        const page = await createPage();
        await saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "Welcome"));

        // The editor sends back what it got delivered, with a child under the instance and an override.
        const [byId] = await handler.wb.getPageById({ id: page.id });
        const delivered = byId.data.websiteBuilder.getPageById.data;
        const childId = "headerChild";
        const override = { inputs: { title: { id: "b1", type: "text", static: "Changed" } } };

        const [update] = await handler.wb.updatePage({
            id: page.id,
            data: {
                elements: {
                    ...delivered.elements,
                    [childId]: {
                        type: "Webiny/Element",
                        id: childId,
                        component: { name: "Webiny/Text" },
                        parent: { id: "$global:Demo/Header", slot: "children", index: 0 }
                    }
                },
                bindings: {
                    ...pageContent.bindings,
                    "$global:Demo/Header": override,
                    [childId]: { inputs: {}, styles: {}, overrides: {} }
                }
            }
        });
        expect(update.data.websiteBuilder.updatePage.error).toBeNull();

        // The response is the page as stored: no instance elements, the bindings as sent.
        const updated = update.data.websiteBuilder.updatePage.data;
        expect(Object.keys(updated.elements)).toEqual(["root"]);
        expect(updated.bindings["$global:Demo/Header"]).toEqual(override);

        const context = await useHandler({}).handler();
        const stored = await context.container.resolve(GetPageByIdUseCase).execute(page.id);
        expect(Object.keys(stored.value!.elements)).toEqual(["root"]);
        expect(Object.keys(stored.value!.bindings).sort()).toEqual(
            ["$global:Demo/Header", childId, "root"].sort()
        );

        // Delivered, the page's override wins over the record; the record itself is unchanged.
        expect(await getDeliveredTitle(page.id)).toBe("Changed");
        const header = await getGlobalComponent("Demo/Header");
        expect(header.data.bindings["$global:Demo/Header"].inputs.title.static).toBe("Welcome");

        // The override is that page's only: another page shows the record.
        const second = await createPage({ path: "/second-page" });
        expect(await getDeliveredTitle(second.id)).toBe("Welcome");
    });

    it("stores bindings sent without elements as they are", async () => {
        const page = await createPage();
        const override = { inputs: { title: { id: "b1", type: "text", static: "Mine" } } };

        const [update] = await handler.wb.updatePage({
            id: page.id,
            data: { bindings: { ...pageContent.bindings, "$global:Demo/Header": override } }
        });
        expect(update.data.websiteBuilder.updatePage.error).toBeNull();

        const context = await useHandler({}).handler();
        const stored = await context.container.resolve(GetPageByIdUseCase).execute(page.id);
        expect(stored.value!.bindings["$global:Demo/Header"]).toEqual(override);
        expect(stored.value!.elements).toEqual(pageContent.elements);
    });

    it("rejects anonymous requests", async () => {
        // The test security grants full access by default; an anonymous visitor has no permissions.
        const anonymousHandler = useGraphQlHandler({ identity: null, permissions: [] });

        const read = await getGlobalComponent("Demo/Header", anonymousHandler);
        expect(read.data).toBeNull();
        expect(read.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");

        const list = await listGlobalComponents(anonymousHandler);
        expect(list.data).toBeNull();
        expect(list.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");

        const save = await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Welcome"),
            anonymousHandler
        );
        expect(save.data).toBeNull();
        expect(save.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("rejects identities without page permissions", async () => {
        const noPermissionsHandler = useGraphQlHandler({ permissions: [] });

        const read = await getGlobalComponent("Demo/Header", noPermissionsHandler);
        expect(read.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");

        const list = await listGlobalComponents(noPermissionsHandler);
        expect(list.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");

        const save = await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Welcome"),
            noPermissionsHandler
        );
        expect(save.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("lets page readers read global components, but not save them", async () => {
        await saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "Welcome"));

        const readerHandler = useGraphQlHandler({
            permissions: [{ name: "wb.page", rwd: "r" }]
        });

        const read = await getGlobalComponent("Demo/Header", readerHandler);
        expect(read.error).toBeNull();
        expect(read.data.name).toBe("Demo/Header");

        const list = await listGlobalComponents(readerHandler);
        expect(list.error).toBeNull();
        expect(list.data.map((item: { name: string }) => item.name)).toEqual(["Demo/Header"]);

        const save = await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Changed"),
            readerHandler
        );
        expect(save.data).toBeNull();
        expect(save.error.code).toBe("WebsiteBuilder/Page/NotAuthorized");
    });

    it("keeps a global's records in different languages apart", async () => {
        const english = createGlobal("Demo/Header", "Welcome");
        const german = createGlobal("Demo/Header", "Willkommen");
        const plain = createGlobal("Demo/Header", "Plain");

        await saveGlobalComponent("Demo/Header", english, handler, "en");
        await saveGlobalComponent("Demo/Header", german, handler, "de");
        await saveGlobalComponent("Demo/Header", plain);

        expect(await getGlobalComponent("Demo/Header", handler, "en")).toEqual({
            data: { name: "Demo/Header", language: "en", ...english },
            error: null
        });
        expect(await getGlobalComponent("Demo/Header", handler, "de")).toEqual({
            data: { name: "Demo/Header", language: "de", ...german },
            error: null
        });
        expect(await getGlobalComponent("Demo/Header")).toEqual({
            data: { name: "Demo/Header", language: "default", ...plain },
            error: null
        });

        // Reads are exact: there is no fallback to another language.
        const french = await getGlobalComponent("Demo/Header", handler, "fr");
        expect(french.error.code).toBe("WebsiteBuilder/GlobalComponent/NotFound");

        expect(await listGlobalComponents(handler, "de")).toEqual({
            data: [{ name: "Demo/Header", language: "de", ...german }],
            error: null
        });
        expect(await listGlobalComponents()).toEqual({
            data: [{ name: "Demo/Header", language: "default", ...plain }],
            error: null
        });
        expect(await listGlobalComponents(handler, "fr")).toEqual({ data: [], error: null });
    });

    it("keeps a global's scoped records apart from the records without a scope", async () => {
        const plain = createGlobal("Demo/Header", "Plain");
        const scopedA = createGlobal("Demo/Header", "Scope A");
        const scopedB = createGlobal("Demo/Header", "Scope B");
        await saveGlobalComponent("Demo/Header", plain, handler, "en");

        // Core never sets a scope; an extension does, through the repositories.
        const { container } = await useHandler({}).handler();
        const save = container.resolve(SaveGlobalComponentRepository);
        const get = container.resolve(GetGlobalComponentRepository);
        const list = container.resolve(ListGlobalComponentsRepository);

        const saved = await save.execute({
            name: "Demo/Header",
            language: "en",
            scope: "a",
            ...scopedA
        });
        expect(saved.value).toEqual({
            name: "Demo/Header",
            language: "en",
            scope: "a",
            ...scopedA
        });
        await save.execute({ name: "Demo/Header", language: "en", scope: "b", ...scopedB });
        // Saving a scope again replaces its record.
        await save.execute({ name: "Demo/Header", language: "en", scope: "a", ...scopedA });

        const getA = await get.execute({ name: "Demo/Header", language: "en", scope: "a" });
        expect(getA.value).toEqual({ name: "Demo/Header", language: "en", scope: "a", ...scopedA });
        const getPlain = await get.execute({ name: "Demo/Header", language: "en" });
        expect(getPlain.value).toEqual({ name: "Demo/Header", language: "en", ...plain });
        const getC = await get.execute({ name: "Demo/Header", language: "en", scope: "c" });
        expect(getC.error?.code).toBe("WebsiteBuilder/GlobalComponent/NotFound");

        expect((await list.execute({ language: "en", scope: "b" })).value).toEqual([
            { name: "Demo/Header", language: "en", scope: "b", ...scopedB }
        ]);
        expect((await list.execute({ language: "en" })).value).toEqual([
            { name: "Demo/Header", language: "en", ...plain }
        ]);

        // Without a scope, the API reads and writes only the records without one.
        expect(await listGlobalComponents(handler, "en")).toEqual({
            data: [{ name: "Demo/Header", language: "en", ...plain }],
            error: null
        });
        expect(await getGlobalComponent("Demo/Header", handler, "en")).toEqual({
            data: { name: "Demo/Header", language: "en", ...plain },
            error: null
        });
    });

    it("keeps one record per global and language across first saves made at the same time", async () => {
        await Promise.all([
            saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "One"), handler, "de"),
            saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "Two"), handler, "de")
        ]);

        const list = await listGlobalComponents(handler, "de");
        expect(list.error).toBeNull();
        expect(list.data).toHaveLength(1);
    });

    it('delivers a page with the globals of its language, else of the default language, else of "default"', async () => {
        await createLanguage("en", true);
        await createLanguage("de", false);

        const englishPage = await createPage({ language: "en", path: "/en/page-a" });
        const germanPage = await createPage({ language: "de", path: "/de/page-a" });

        // Nothing stored yet: the frontend renders the manifest defaults.
        expect(await getDeliveredTitle(germanPage.id)).toBeNull();

        await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Welcome"),
            handler,
            "en"
        );
        expect(await getDeliveredTitle(englishPage.id)).toBe("Welcome");
        // A global missing in the page's language comes from the site's default language.
        expect(await getDeliveredTitle(germanPage.id)).toBe("Welcome");

        // The site's default language comes before "default".
        await saveGlobalComponent("Demo/Header", createGlobal("Demo/Header", "Default"));
        expect(await getDeliveredTitle(germanPage.id)).toBe("Welcome");
        expect(await getDeliveredTitle(englishPage.id)).toBe("Welcome");

        await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Willkommen"),
            handler,
            "de"
        );
        expect(await getDeliveredTitle(germanPage.id)).toBe("Willkommen");
        // Saving in one language leaves the pages of another as they were.
        expect(await getDeliveredTitle(englishPage.id)).toBe("Welcome");
    });

    it('delivers a page without a language with the "default" globals', async () => {
        await createLanguage("en", true);
        const page = await createPage();

        await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Welcome"),
            handler,
            "en"
        );
        expect(await getDeliveredTitle(page.id)).toBeNull();

        // "default" and an omitted language are the same.
        await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Plain"),
            handler,
            "default"
        );
        expect(await getDeliveredTitle(page.id)).toBe("Plain");
        expect((await getGlobalComponent("Demo/Header")).data.language).toBe("default");
    });

    it('lists the "default" record of globals missing in a language with `fallback`', async () => {
        const header = createGlobal("Demo/Header", "Header");
        const footer = createGlobal("Demo/Footer", "Footer");
        const germanFooter = createGlobal("Demo/Footer", "Fusszeile");

        await saveGlobalComponent("Demo/Header", header);
        await saveGlobalComponent("Demo/Footer", footer);
        await saveGlobalComponent("Demo/Footer", germanFooter, handler, "de");

        expect(await listGlobalComponents(handler, "de")).toEqual({
            data: [{ name: "Demo/Footer", language: "de", ...germanFooter }],
            error: null
        });

        const withFallback = await listGlobalComponents(handler, "de", true);
        expect(withFallback.error).toBeNull();
        expect(sortByName(withFallback.data)).toEqual([
            { name: "Demo/Footer", language: "de", ...germanFooter },
            { name: "Demo/Header", language: "default", ...header }
        ]);
    });

    it("ignores records stored without a language", async () => {
        // A record from before "default": stored with no language, so it has no fixed entry id.
        const context = await useHandler({}).handler();
        const created = await context.container
            .resolve(CreateEntryUseCase)
            .execute(await context.container.resolve(GlobalComponentModelProvider).get(), {
                id: "wbgc-stored-without-language",
                values: {
                    name: "Demo/Header",
                    language: null,
                    ...createGlobal("Demo/Header", "Old")
                }
            });
        expect(created.isOk()).toBe(true);

        expect(await listGlobalComponents()).toEqual({ data: [], error: null });
        const page = await createPage();
        expect(await getDeliveredTitle(page.id)).toBeNull();
    });

    it("publishes events when a global component is saved", async () => {
        const events: string[] = [];
        const dispatched: { name: string; data: any }[] = [];

        class BeforeSave implements GlobalComponentBeforeSaveEventHandler.Interface {
            async handle(event: GlobalComponentBeforeSaveEventHandler.Event) {
                events.push(`${event.eventType}:${event.payload.input.language}`);
            }
        }
        class AfterSave implements GlobalComponentAfterSaveEventHandler.Interface {
            async handle(event: GlobalComponentAfterSaveEventHandler.Event) {
                events.push(`${event.eventType}:${event.payload.globalComponent.name}`);
            }
        }

        const eventsHandler = useGraphQlHandler({
            legacyPlugins: [
                (container: Container) => {
                    container.register(
                        GlobalComponentBeforeSaveEventHandler.createImplementation({
                            implementation: BeforeSave,
                            dependencies: []
                        })
                    );
                    container.register(
                        GlobalComponentAfterSaveEventHandler.createImplementation({
                            implementation: AfterSave,
                            dependencies: []
                        })
                    );
                    container.registerInstance(WebhookDispatcher, {
                        async dispatch(name: string, data: any) {
                            dispatched.push({ name, data });
                        }
                    });
                }
            ]
        });

        const saved = await saveGlobalComponent(
            "Demo/Header",
            createGlobal("Demo/Header", "Welcome"),
            eventsHandler
        );
        expect(saved.error).toBeNull();

        expect(events).toEqual([
            "globalComponent.beforeSave:default",
            "globalComponent.afterSave:Demo/Header"
        ]);
        expect(dispatched.map(item => item.name)).toEqual(["wb.globalComponent.saved"]);
        expect(dispatched[0].data.globalComponent.name).toBe("Demo/Header");
    });
});
