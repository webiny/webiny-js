import type { Container } from "@webiny/di";
import { beforeEach, describe, expect, it } from "vitest";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import {
    CreateLayoutRepository,
    LayoutAfterCreateEventHandler
} from "~/features/layouts/CreateLayout/index.js";
import { LayoutAfterUpdateEventHandler } from "~/features/layouts/UpdateLayout/index.js";
import { LayoutAfterPublishEventHandler } from "~/features/layouts/PublishLayout/index.js";
import { LayoutAfterUnpublishEventHandler } from "~/features/layouts/UnpublishLayout/index.js";
import { LayoutAfterDeleteEventHandler } from "~/features/layouts/DeleteLayout/index.js";
import { LayoutAfterTranslateEventHandler } from "~/features/layouts/TranslateLayout/index.js";
import { LayoutAfterDuplicateEventHandler } from "~/features/layouts/DuplicateLayout/index.js";
import { LayoutAfterCreateRevisionFromEventHandler } from "~/features/layouts/CreateLayoutRevisionFrom/index.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";

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
        data
    }
`;

const LAYOUT_FIELDS = /* GraphQL */ `
    id
    entryId
    status
    version
    locked
    live {
        version
    }
    properties
    metadata
    elements
    bindings
    extensions
    createdOn
    savedOn
    createdBy {
        id
    }
`;

const LAYOUT_RESPONSE = /* GraphQL */ `
    data {
        ${LAYOUT_FIELDS}
    }
    ${ERROR_FIELDS}
`;

const GET_LAYOUT = /* GraphQL */ `
    query GetLayout($id: ID!) {
        websiteBuilder {
            getLayout(id: $id) {
                ${LAYOUT_RESPONSE}
            }
        }
    }
`;

const LIST_LAYOUTS = /* GraphQL */ `
    query ListLayouts {
        websiteBuilder {
            listLayouts {
                ${LAYOUT_RESPONSE}
            }
        }
    }
`;

const GET_LAYOUT_REVISIONS = /* GraphQL */ `
    query GetLayoutRevisions($entryId: ID!) {
        websiteBuilder {
            getLayoutRevisions(entryId: $entryId) {
                ${LAYOUT_RESPONSE}
            }
        }
    }
`;

const GET_PAGE_LAYOUT = /* GraphQL */ `
    query GetPageLayout($id: ID!, $language: String) {
        websiteBuilder {
            getPageLayout(id: $id, language: $language) {
                ${LAYOUT_RESPONSE}
            }
        }
    }
`;

const GET_LAYOUT_BY_SLUG = /* GraphQL */ `
    query GetLayoutBySlug($slug: String!, $language: String) {
        websiteBuilder {
            getLayoutBySlug(slug: $slug, language: $language) {
                data {
                    elements
                    bindings
                    layout {
                        ${LAYOUT_FIELDS}
                    }
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const GET_LAYOUT_USAGE = /* GraphQL */ `
    query GetLayoutUsage($id: ID!) {
        websiteBuilder {
            getLayoutUsage(id: $id) {
                data {
                    pages
                    isDefault
                    models {
                        modelId
                        name
                    }
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const GET_LAYOUT_SETTINGS = /* GraphQL */ `
    query GetLayoutSettings {
        websiteBuilder {
            getLayoutSettings {
                data {
                    defaultLayout
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const CREATE_LAYOUT = /* GraphQL */ `
    mutation CreateLayout($data: WbLayoutCreateInput!) {
        websiteBuilder {
            createLayout(data: $data) {
                ${LAYOUT_RESPONSE}
            }
        }
    }
`;

const UPDATE_LAYOUT = /* GraphQL */ `
    mutation UpdateLayout($id: ID!, $data: WbLayoutUpdateInput!) {
        websiteBuilder {
            updateLayout(id: $id, data: $data) {
                ${LAYOUT_RESPONSE}
            }
        }
    }
`;

const layoutMutation = (name: string, args = "$id: ID!", call = "id: $id") => /* GraphQL */ `
    mutation Run(${args}) {
        websiteBuilder {
            ${name}(${call}) {
                ${LAYOUT_RESPONSE}
            }
        }
    }
`;

const booleanMutation = (name: string) => /* GraphQL */ `
    mutation Run($id: ID!) {
        websiteBuilder {
            ${name}(id: $id) {
                data
                ${ERROR_FIELDS}
            }
        }
    }
`;

const PUBLISH_LAYOUT = layoutMutation("publishLayout");
const UNPUBLISH_LAYOUT = layoutMutation("unpublishLayout");
const CREATE_LAYOUT_REVISION_FROM = layoutMutation("createLayoutRevisionFrom");
const DUPLICATE_LAYOUT = layoutMutation("duplicateLayout");
const TRANSLATE_LAYOUT = layoutMutation(
    "translateLayout",
    "$id: ID!, $language: String!",
    "id: $id, language: $language"
);
const DELETE_LAYOUT = booleanMutation("deleteLayout");
const DELETE_LAYOUT_REVISION = booleanMutation("deleteLayoutRevision");

const SET_DEFAULT_LAYOUT = /* GraphQL */ `
    mutation SetDefaultLayout($id: ID) {
        websiteBuilder {
            setDefaultLayout(id: $id) {
                data {
                    defaultLayout
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const PAGE_FIELDS = /* GraphQL */ `
    data {
        id
        properties
        elements
        bindings
        layout {
            id
            entryId
            properties
            elements
            bindings
        }
    }
    ${ERROR_FIELDS}
`;

const GET_PAGE_BY_ID = /* GraphQL */ `
    query GetPageById($id: ID!, $raw: Boolean) {
        websiteBuilder {
            getPageById(id: $id, raw: $raw) {
                ${PAGE_FIELDS}
            }
        }
    }
`;

const GET_PAGE_BY_PATH = /* GraphQL */ `
    query GetPageByPath($path: String!) {
        websiteBuilder {
            getPageByPath(path: $path) {
                ${PAGE_FIELDS}
            }
        }
    }
`;

const CREATE_PAGE = /* GraphQL */ `
    mutation CreatePage($data: WbPageCreateInput!) {
        websiteBuilder {
            createPage(data: $data) {
                ${PAGE_FIELDS}
            }
        }
    }
`;

const UPDATE_PAGE = /* GraphQL */ `
    mutation UpdatePage($id: ID!, $data: WbPageUpdateInput!) {
        websiteBuilder {
            updatePage(id: $id, data: $data) {
                ${PAGE_FIELDS}
            }
        }
    }
`;

const SAVE_GLOBAL_COMPONENT = /* GraphQL */ `
    mutation SaveGlobalComponent($name: String!, $language: String, $data: WbGlobalComponentInput!) {
        websiteBuilder {
            saveGlobalComponent(name: $name, language: $language, data: $data) {
                data {
                    name
                    language
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const HEADER = "$global:Demo/Header";

const text = (value: string) => ({ id: `b-${value}`, type: "text", static: value });

// A layout: a placement of the header, a banner of its own, and the page content.
const createLayoutDocument = (bannerText = "Layout banner") => {
    return {
        elements: {
            root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } },
            headerPlacement: {
                type: "Webiny/Element",
                id: "headerPlacement",
                component: { name: "Demo/Header" },
                parent: { id: "root", slot: "children" }
            },
            banner: {
                type: "Webiny/Element",
                id: "banner",
                component: { name: "Demo/Banner" },
                parent: { id: "root", slot: "children" }
            },
            content: {
                type: "Webiny/Element",
                id: "content",
                component: { name: "Webiny/LayoutContent" },
                parent: { id: "root", slot: "children" }
            }
        } as Record<string, any>,
        bindings: {
            root: {
                inputs: {
                    children: {
                        type: "slot",
                        list: true,
                        static: ["headerPlacement", "banner", "content"]
                    }
                }
            },
            banner: { inputs: { text: text(bannerText) } }
        } as Record<string, any>
    };
};

const createHeaderRecord = (title: string) => {
    return {
        elements: {
            [HEADER]: { type: "Webiny/Element", id: HEADER, component: { name: "Demo/Header" } },
            logo: {
                type: "Webiny/Element",
                id: "logo",
                component: { name: "Demo/Logo" },
                parent: { id: HEADER, slot: "children" }
            }
        },
        bindings: {
            [HEADER]: {
                inputs: { title: text(title), subtitle: text(`${title} subtitle`) },
                styles: {},
                overrides: {}
            },
            logo: { inputs: { alt: text("Logo") }, styles: {}, overrides: {} }
        }
    };
};

describe("Layouts GraphQL", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    const run = async (query: string, variables: Record<string, any> = {}, h = handler) => {
        const [response] = await h.invoke({ body: { query, variables } });
        if (response.errors) {
            throw new Error(JSON.stringify(response.errors));
        }
        return response.data.websiteBuilder;
    };

    const createLayout = async (data: Record<string, any>, h = handler) => {
        return (await run(CREATE_LAYOUT, { data }, h)).createLayout;
    };

    const updateLayout = async (id: string, data: Record<string, any>) => {
        return (await run(UPDATE_LAYOUT, { id, data })).updateLayout;
    };

    const getLayout = async (id: string) => (await run(GET_LAYOUT, { id })).getLayout;
    const listLayouts = async () => (await run(LIST_LAYOUTS)).listLayouts;
    const publishLayout = async (id: string) => (await run(PUBLISH_LAYOUT, { id })).publishLayout;
    const unpublishLayout = async (id: string) =>
        (await run(UNPUBLISH_LAYOUT, { id })).unpublishLayout;
    const createRevisionFrom = async (id: string) =>
        (await run(CREATE_LAYOUT_REVISION_FROM, { id })).createLayoutRevisionFrom;
    const deleteLayout = async (id: string) => (await run(DELETE_LAYOUT, { id })).deleteLayout;
    const deleteLayoutRevision = async (id: string) =>
        (await run(DELETE_LAYOUT_REVISION, { id })).deleteLayoutRevision;
    const duplicateLayout = async (id: string) =>
        (await run(DUPLICATE_LAYOUT, { id })).duplicateLayout;
    const translateLayout = async (id: string, language: string) =>
        (await run(TRANSLATE_LAYOUT, { id, language })).translateLayout;
    const getPageLayout = async (id: string, language?: string) =>
        (await run(GET_PAGE_LAYOUT, { id, language })).getPageLayout;
    const setDefaultLayout = async (id: string | null) =>
        (await run(SET_DEFAULT_LAYOUT, { id })).setDefaultLayout;
    const getLayoutBySlug = async (slug: string, language?: string, h = handler) =>
        (await run(GET_LAYOUT_BY_SLUG, { slug, language }, h)).getLayoutBySlug;
    const getLayoutUsage = async (id: string) =>
        (await run(GET_LAYOUT_USAGE, { id })).getLayoutUsage;

    // A CMS model whose entries render in the layout with the slug.
    const createLayoutModel = async (name: string, settings: Record<string, any>) => {
        const { container } = await useHandler({}).handler();
        const group = await container.resolve(CreateGroupUseCase).execute({
            name: `${name} group`,
            slug: `${name.toLowerCase()}-group`,
            icon: { type: "icon", name: "fas/star" },
            description: ""
        });
        if (group.isFail()) {
            throw group.error;
        }

        const modelId = name.toLowerCase();
        const model = await container.resolve(CreateModelUseCase).execute({
            name,
            modelId,
            singularApiName: name,
            pluralApiName: `${name}s`,
            group: group.value.id,
            titleFieldId: "title",
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    type: "text",
                    label: "Title",
                    storageId: "text@title"
                }
            ],
            layout: [["title"]],
            settings
        } as any);
        if (model.isFail()) {
            throw model.error;
        }
        return { modelId, name };
    };

    const createPublishedLayout = async (title: string, data: Record<string, any> = {}) => {
        const created = await createLayout({ properties: { title }, ...data });
        expect(created.error).toBeNull();
        const published = await publishLayout(created.data.id);
        expect(published.error).toBeNull();
        return published.data;
    };

    const createPage = async (properties: Record<string, any>, data: Record<string, any> = {}) => {
        const result = (
            await run(CREATE_PAGE, {
                data: {
                    ...pageMocks.pageA,
                    ...data,
                    properties: { ...pageMocks.pageA.properties, ...properties }
                }
            })
        ).createPage;
        expect(result.error).toBeNull();
        return result.data;
    };

    const getPageById = async (id: string, raw?: boolean) => {
        return (await run(GET_PAGE_BY_ID, { id, raw })).getPageById;
    };

    const saveHeader = async (title: string, language?: string) => {
        const result = (
            await run(SAVE_GLOBAL_COMPONENT, {
                name: "Demo/Header",
                language,
                data: createHeaderRecord(title)
            })
        ).saveGlobalComponent;
        expect(result.error).toBeNull();
    };

    const createLanguage = async (code: string, isDefault = false) => {
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

    it("creates a draft layout with the page content placeholder in it", async () => {
        const created = await createLayout({ properties: { title: "  Main layout " } });

        expect(created.error).toBeNull();
        expect(created.data).toMatchObject({
            id: `${created.data.entryId}#0001`,
            status: "draft",
            version: 1,
            locked: false,
            live: null,
            properties: { title: "Main layout" }
        });
        expect(Object.values(created.data.elements).map((el: any) => el.component.name)).toEqual([
            "Webiny/Root",
            "Webiny/LayoutContent"
        ]);

        expect(await getLayout(created.data.id)).toEqual(created);
        expect(await getLayout(created.data.entryId)).toEqual(created);
        expect(await listLayouts()).toEqual({ data: [created.data], error: null });
    });

    it("rejects a layout without a title, or without exactly one main page content area", async () => {
        const { elements, bindings } = createLayoutDocument();
        const { content: _, ...withoutContent } = elements;

        const noTitle = await createLayout({ properties: { title: " " } });
        expect(noTitle.error.code).toBe("WebsiteBuilder/Layout/ValidationError");

        const noContent = await createLayout({
            properties: { title: "A" },
            elements: withoutContent,
            bindings
        });
        expect(noContent.error.code).toBe("WebsiteBuilder/Layout/ValidationError");

        const twoContents = await createLayout({
            properties: { title: "A" },
            elements: { ...elements, content2: { ...elements.content, id: "content2" } },
            bindings
        });
        expect(twoContents.error.code).toBe("WebsiteBuilder/Layout/ValidationError");

        expect(await listLayouts()).toEqual({ data: [], error: null });
    });

    it("keeps named content areas, including one without a name, and ones sharing a name", async () => {
        const { elements, bindings } = createLayoutDocument();
        const named = (id: string) => ({
            type: "Webiny/Element",
            id,
            component: { name: "Webiny/NamedContent" },
            parent: { id: "root", slot: "children" }
        });

        const created = await createLayout({
            properties: { title: "With areas" },
            elements: { ...elements, a: named("a"), b: named("b") },
            bindings: {
                ...bindings,
                content: { inputs: { area: { id: "x", type: "text", static: "ignored" } } },
                a: { inputs: { area: { id: "a", type: "text", static: "sidebar" } } }
            }
        });
        expect(created.error).toBeNull();

        // An area's name is only a label: pages store their content of it by the area's element id.
        const sameNames = await createLayout({
            properties: { title: "Same names" },
            elements: { ...elements, a: named("a"), b: named("b") },
            bindings: {
                ...bindings,
                a: { inputs: { area: { id: "a", type: "text", static: "main" } } },
                b: { inputs: { area: { id: "b", type: "text", static: "main" } } }
            }
        });
        expect(sameNames.error).toBeNull();
        expect(created.data.elements.content.component.name).toBe("Webiny/LayoutContent");
        expect(created.data.elements.a.component.name).toBe("Webiny/NamedContent");
    });

    it("opens a layout stored without a title or a document as an untitled new layout", async () => {
        const context = await useHandler({}).handler();
        const stored = await context.container
            .resolve(CreateLayoutRepository)
            .execute({ properties: {}, metadata: {}, extensions: {} } as any);
        if (stored.isFail()) {
            throw stored.error;
        }

        const opened = await getLayout(stored.value.id);
        expect(opened.error).toBeNull();
        expect(opened.data.properties.title).toBe("Untitled");
        expect(opened.data.elements.root.component.name).toBe("Webiny/Root");
        expect(Object.values(opened.data.elements).map((el: any) => el.component.name)).toContain(
            "Webiny/LayoutContent"
        );

        // Saving the document as opened, with an empty title, keeps the title.
        const saved = await updateLayout(stored.value.id, {
            properties: { title: "" },
            elements: opened.data.elements,
            bindings: opened.data.bindings
        });
        expect(saved.error).toBeNull();
        expect(saved.data.properties.title).toBe("Untitled");

        const renamed = await updateLayout(stored.value.id, { properties: { title: " Main " } });
        expect(renamed.data.properties.title).toBe("Main");
    });

    it("rejects a named area sent as a second main content", async () => {
        const { elements, bindings } = createLayoutDocument();

        const created = await createLayout({
            properties: { title: "With sidebar" },
            elements: { ...elements, sidebar: { ...elements.content, id: "sidebar" } },
            bindings: {
                ...bindings,
                sidebar: { inputs: { area: { id: "s", type: "text", static: "sidebar" } } }
            }
        });

        expect(created.error.code).toBe("WebsiteBuilder/Layout/ValidationError");
    });

    it("never stores global instance elements in a layout, but keeps all bindings", async () => {
        const { elements, bindings } = createLayoutDocument();
        const record = createHeaderRecord("Sent");
        const override = { inputs: { subtitle: text("Layout subtitle") } };

        const created = await createLayout({
            properties: { title: "Main" },
            elements: { ...elements, ...record.elements },
            bindings: { ...bindings, [HEADER]: override, logo: record.bindings.logo }
        });
        expect(created.error).toBeNull();
        expect(Object.keys(created.data.elements).sort()).toEqual(Object.keys(elements).sort());
        expect(created.data.bindings[HEADER]).toEqual(override);
        expect(created.data.bindings.logo).toEqual(record.bindings.logo);

        // An update drops them too; bindings sent alone are stored as they are.
        const updated = await updateLayout(created.data.id, {
            elements: { ...elements, ...record.elements }
        });
        expect(Object.keys(updated.data.elements).sort()).toEqual(Object.keys(elements).sort());

        const bindingsOnly = await updateLayout(created.data.id, {
            bindings: { ...bindings, [HEADER]: { inputs: { title: text("Mine") } } }
        });
        expect(bindingsOnly.error).toBeNull();
        expect(bindingsOnly.data.bindings[HEADER].inputs.title.static).toBe("Mine");
        expect(bindingsOnly.data.elements).toEqual(updated.data.elements);
    });

    it("opens global instances referenced in a layout's slots as placements under the root", async () => {
        const { elements, bindings } = createLayoutDocument();
        const created = await createLayout({
            properties: { title: "Old" },
            elements,
            bindings: {
                ...bindings,
                root: {
                    inputs: {
                        children: {
                            type: "slot",
                            list: true,
                            static: [HEADER, "banner", "content", HEADER]
                        }
                    }
                }
            }
        });
        expect(created.error).toBeNull();

        const opened = await getLayout(created.data.id);
        expect(opened.data.bindings.root.inputs.children.static).toEqual([
            "placement-Demo-Header-1",
            "banner",
            "content",
            "placement-Demo-Header-2"
        ]);
        expect(opened.data.elements["placement-Demo-Header-1"]).toEqual({
            type: "Webiny/Element",
            id: "placement-Demo-Header-1",
            component: { name: "Demo/Header" },
            parent: { id: "root", slot: "children" }
        });
        expect(opened.data.elements[HEADER]).toBeUndefined();

        // Opened again, the placements keep their ids; saved, they're stored as they are.
        expect(await getLayout(created.data.id)).toEqual(opened);
        const saved = await updateLayout(created.data.id, {
            elements: opened.data.elements,
            bindings: opened.data.bindings
        });
        expect(saved.data.elements).toEqual(opened.data.elements);
    });

    it("keeps a language version's language and source on update", async () => {
        await createLanguage("de");
        const source = await createLayout({ properties: { title: "Main" } });
        const version = await translateLayout(source.data.entryId, "de");

        const updated = await updateLayout(version.data.id, {
            properties: { title: "Haupt", language: "en", sourceLayout: "x" }
        });
        expect(updated.error).toBeNull();
        expect(updated.data.properties).toEqual({
            title: "Haupt",
            language: "de",
            sourceLayout: source.data.entryId
        });
    });

    it("publishes revisions, refuses to change a published one, and creates revisions from old ones", async () => {
        const created = await createLayout({
            properties: { title: "Main" },
            ...createLayoutDocument("First")
        });
        const entryId = created.data.entryId;

        const published = await publishLayout(created.data.id);
        expect(published.error).toBeNull();
        expect(published.data).toMatchObject({
            id: `${entryId}#0001`,
            status: "published",
            locked: true,
            live: { version: 1 }
        });

        const locked = await updateLayout(`${entryId}#0001`, { properties: { title: "X" } });
        expect(locked.error.code).toBe("WebsiteBuilder/Layout/Locked");

        const second = await createRevisionFrom(`${entryId}#0001`);
        expect(second.error).toBeNull();
        expect(second.data).toMatchObject({
            id: `${entryId}#0002`,
            status: "draft",
            locked: false,
            version: 2
        });
        expect(second.data.elements).toEqual(created.data.elements);

        const edited = await updateLayout(second.data.id, createLayoutDocument("Second"));
        expect(edited.error).toBeNull();
        expect(edited.data.bindings.banner.inputs.text.static).toBe("Second");

        // Until the new revision is published, pages get the published one.
        expect((await getPageLayout(entryId)).data.id).toBe(`${entryId}#0001`);

        const publishedSecond = await publishLayout(second.data.id);
        expect(publishedSecond.data.live).toEqual({ version: 2 });
        expect((await getPageLayout(entryId)).data.bindings.banner.inputs.text.static).toBe(
            "Second"
        );

        // A revision from the old one brings back its content.
        const third = await createRevisionFrom(`${entryId}#0001`);
        expect(third.data.id).toBe(`${entryId}#0003`);
        expect(third.data.bindings.banner.inputs.text.static).toBe("First");

        const revisions = (await run(GET_LAYOUT_REVISIONS, { entryId })).getLayoutRevisions;
        expect(revisions.data.map((revision: any) => [revision.id, revision.status])).toEqual([
            [`${entryId}#0003`, "draft"],
            [`${entryId}#0002`, "published"],
            [`${entryId}#0001`, "unpublished"]
        ]);

        // The list holds the latest revision, which knows the published version.
        const list = await listLayouts();
        expect(list.data.map((layout: any) => [layout.id, layout.live])).toEqual([
            [`${entryId}#0003`, { version: 2 }]
        ]);

        // A draft revision that's not in use can be deleted; the latest becomes the previous one.
        expect(await deleteLayoutRevision(`${entryId}#0003`)).toEqual({ data: true, error: null });
        expect((await getLayout(entryId)).data.id).toBe(`${entryId}#0002`);
    });

    it("unpublishes a layout that is not in use", async () => {
        const layout = await createPublishedLayout("Main");

        const unpublished = await unpublishLayout(layout.entryId);
        expect(unpublished.error).toBeNull();
        expect(unpublished.data.status).toBe("unpublished");
        expect((await getPageLayout(layout.entryId)).data).toBeNull();
    });

    it("refuses to unpublish or delete a layout that pages use, or that is the default", async () => {
        const layout = await createPublishedLayout("Main");
        const entryId = layout.entryId;
        const second = await createRevisionFrom(layout.id);
        await publishLayout(second.data.id);

        const page = await createPage({ layout: entryId });

        const inUse = {
            code: "WebsiteBuilder/Layout/InUse",
            data: { id: entryId, pages: 1, isDefault: false }
        };
        expect(await unpublishLayout(entryId)).toMatchObject({ data: null, error: inUse });
        expect(await deleteLayout(entryId)).toMatchObject({ data: null, error: inUse });
        expect(await deleteLayoutRevision(`${entryId}#0002`)).toMatchObject({
            data: null,
            error: inUse
        });

        // A revision that's not published can go.
        expect(await deleteLayoutRevision(`${entryId}#0001`)).toEqual({ data: true, error: null });

        // Pages in the trash don't count.
        const [trashed] = await handler.wb.trashPage({ id: page.id });
        expect(trashed.data.websiteBuilder.trashPage.error).toBeNull();

        expect((await setDefaultLayout(entryId)).error).toBeNull();
        expect(await unpublishLayout(entryId)).toMatchObject({
            error: {
                code: "WebsiteBuilder/Layout/InUse",
                data: { id: entryId, pages: 0, isDefault: true }
            }
        });
        expect((await deleteLayout(entryId)).error.code).toBe("WebsiteBuilder/Layout/InUse");

        await setDefaultLayout(null);
        expect((await unpublishLayout(entryId)).error).toBeNull();
        expect(await deleteLayout(entryId)).toEqual({ data: true, error: null });
        expect(await listLayouts()).toEqual({ data: [], error: null });
    });

    it("counts only the pages in a language version's language as its usage", async () => {
        await createLanguage("en", true);
        await createLanguage("de");
        const source = await createPublishedLayout("Main");
        const version = await translateLayout(source.entryId, "de");
        await publishLayout(version.data.id);

        await createPage({ layout: source.entryId, language: "en", path: "/en/a" });

        expect((await unpublishLayout(version.data.id)).error).toBeNull();
        await publishLayout(version.data.id);

        await createPage({ layout: source.entryId, language: "de", path: "/de/a" });
        expect(await unpublishLayout(version.data.id)).toMatchObject({
            error: {
                code: "WebsiteBuilder/Layout/InUse",
                data: { id: version.data.entryId, pages: 1, isDefault: false }
            }
        });
        // The source is used by pages in every language.
        expect((await unpublishLayout(source.entryId)).error.data.pages).toBe(2);
    });

    it("keeps one language version per source and language", async () => {
        await createLanguage("en", true);
        await createLanguage("de");

        const source = await createLayout({
            properties: { title: "Main", language: "en" },
            ...createLayoutDocument("English")
        });
        const entryId = source.data.entryId;

        // The version copies the source's latest revision.
        await updateLayout(entryId, createLayoutDocument("Latest"));

        const version = await translateLayout(entryId, "de");
        expect(version.error).toBeNull();
        expect(version.data).toMatchObject({
            entryId: LayoutEntryId.from(entryId).versionIn("de").toString(),
            status: "draft",
            version: 1,
            properties: { title: "Main", language: "de", sourceLayout: entryId }
        });
        expect(version.data.bindings.banner.inputs.text.static).toBe("Latest");

        const again = await translateLayout(entryId, "de");
        expect(again.error.code).toBe("WebsiteBuilder/Layout/TranslationError");

        const sameLanguage = await translateLayout(entryId, "en");
        expect(sameLanguage.error.code).toBe("WebsiteBuilder/Layout/TranslationError");

        const ofVersion = await translateLayout(version.data.entryId, "en");
        expect(ofVersion.error.code).toBe("WebsiteBuilder/Layout/TranslationError");

        const unknownLanguage = await translateLayout(entryId, "fr");
        expect(unknownLanguage.error.code).toBe("WebsiteBuilder/Layout/TranslationError");

        const list = await listLayouts();
        expect(list.data).toHaveLength(2);
    });

    it("deletes a source layout with its language versions", async () => {
        await createLanguage("de");
        await createLanguage("fr");
        const source = await createLayout({ properties: { title: "Main" } });
        await translateLayout(source.data.entryId, "de");
        await translateLayout(source.data.entryId, "fr");
        const other = await createLayout({ properties: { title: "Other" } });

        expect((await listLayouts()).data).toHaveLength(4);

        expect(await deleteLayout(source.data.entryId)).toEqual({ data: true, error: null });

        const list = await listLayouts();
        expect(list.data.map((layout: any) => layout.entryId)).toEqual([other.data.entryId]);

        // Deleting a version keeps its source.
        await createLanguage("it");
        const otherVersion = await translateLayout(other.data.entryId, "it");
        expect(await deleteLayout(otherVersion.data.entryId)).toEqual({ data: true, error: null });
        expect((await listLayouts()).data.map((layout: any) => layout.entryId)).toEqual([
            other.data.entryId
        ]);
    });

    it("duplicates a source layout into a new draft", async () => {
        await createLanguage("de");
        const source = await createPublishedLayout("Main", {
            properties: { title: "Main", language: "en" },
            ...createLayoutDocument("Banner")
        });

        const duplicate = await duplicateLayout(source.entryId);
        expect(duplicate.error).toBeNull();
        expect(duplicate.data.entryId).not.toBe(source.entryId);
        expect(duplicate.data).toMatchObject({
            status: "draft",
            version: 1,
            properties: { title: "Main (copy)", language: "en" }
        });
        expect(duplicate.data.elements).toEqual(source.elements);
        expect(duplicate.data.bindings).toEqual(source.bindings);

        const version = await translateLayout(source.entryId, "de");
        const ofVersion = await duplicateLayout(version.data.entryId);
        expect(ofVersion.error.code).toBe("WebsiteBuilder/Layout/ValidationError");
    });

    it("gives a layout the slug it was sent, or the first free one made from its title", async () => {
        const blog = await createLayout({ properties: { title: "Blog", slug: "blog-post" } });
        expect(blog.error).toBeNull();
        expect(blog.data.properties.slug).toBe("blog-post");

        const first = await createLayout({ properties: { title: "Main Layout (EN)" } });
        const second = await createLayout({ properties: { title: "Main Layout (EN)" } });
        expect(first.data.properties.slug).toBe("main-layout-en");
        expect(second.data.properties.slug).toBe("main-layout-en-2");
    });

    it("rejects an invalid slug, and one another layout has", async () => {
        const invalid = await createLayout({ properties: { title: "Blog", slug: "Blog Post" } });
        expect(invalid.error.code).toBe("WebsiteBuilder/Layout/ValidationError");

        const blog = await createLayout({ properties: { title: "Blog", slug: "blog" } });
        const taken = await createLayout({ properties: { title: "Other", slug: "blog" } });
        expect(taken.data).toBeNull();
        expect(taken.error).toMatchObject({
            code: "WebsiteBuilder/Layout/SlugTaken",
            data: { slug: "blog", layoutId: blog.data.entryId, title: "Blog" }
        });
        expect(taken.error.message).toContain("slug is already taken");
        expect((await listLayouts()).data).toHaveLength(1);

        const other = await createLayout({ properties: { title: "Other", slug: "other" } });
        const renamed = await updateLayout(other.data.id, { properties: { slug: "blog" } });
        expect(renamed.error.code).toBe("WebsiteBuilder/Layout/SlugTaken");
        const removed = await updateLayout(other.data.id, { properties: { slug: "" } });
        expect(removed.error.code).toBe("WebsiteBuilder/Layout/ValidationError");
    });

    it("changes a layout's slug, and keeps it when it isn't sent", async () => {
        const created = await createLayout({ properties: { title: "Blog", slug: "blog" } });

        const same = await updateLayout(created.data.id, { properties: { slug: "blog" } });
        expect(same.error).toBeNull();

        const renamed = await updateLayout(created.data.id, { properties: { slug: "articles" } });
        expect(renamed.error).toBeNull();
        expect(renamed.data.properties.slug).toBe("articles");

        const retitled = await updateLayout(created.data.id, { properties: { title: "Posts" } });
        expect(retitled.data.properties).toMatchObject({ title: "Posts", slug: "articles" });

        // The old slug is free again.
        const reused = await createLayout({ properties: { title: "Blog", slug: "blog" } });
        expect(reused.error).toBeNull();
    });

    it("keeps a published revision's slug from being used by another layout", async () => {
        const created = await createPublishedLayout("Blog", {
            properties: { title: "Blog", slug: "blog" }
        });
        const draft = await createRevisionFrom(created.id);
        await updateLayout(draft.data.id, { properties: { slug: "articles" } });

        const taken = await createLayout({ properties: { title: "Other", slug: "blog" } });
        expect(taken.error.code).toBe("WebsiteBuilder/Layout/SlugTaken");
    });

    it("gives a duplicate a free slug ending in -copy", async () => {
        const source = await createLayout({ properties: { title: "Blog", slug: "blog" } });

        const first = await duplicateLayout(source.data.entryId);
        const second = await duplicateLayout(source.data.entryId);
        expect(first.data.properties.slug).toBe("blog-copy");
        expect(second.data.properties.slug).toBe("blog-copy-2");
    });

    it("gives a language version no slug of its own, and the source keeps its slug", async () => {
        await createLanguage("de");
        const source = await createLayout({ properties: { title: "Blog", slug: "blog" } });
        const version = await translateLayout(source.data.entryId, "de");
        expect(version.error).toBeNull();
        expect(version.data.properties.slug).toBeUndefined();

        const updated = await updateLayout(version.data.id, { properties: { slug: "blog-de" } });
        expect(updated.error).toBeNull();
        expect(updated.data.properties.slug).toBeUndefined();

        // The source's slug stays its own.
        const other = await createLayout({ properties: { title: "Other", slug: "blog-de" } });
        expect(other.error).toBeNull();
        expect((await getLayout(source.data.id)).data.properties.slug).toBe("blog");
    });

    it("resolves a page's layout: its language version, or else the source, published", async () => {
        await createLanguage("en", true);
        await createLanguage("de");
        await createLanguage("fr");

        const draftOnly = await createLayout({ properties: { title: "Draft" } });
        expect((await getPageLayout(draftOnly.data.entryId)).data).toBeNull();
        expect((await getPageLayout("missing")).data).toBeNull();

        const source = await createPublishedLayout("Main");
        const german = await translateLayout(source.entryId, "de");
        const french = await translateLayout(source.entryId, "fr");
        await publishLayout(german.data.id);

        expect((await getPageLayout(source.entryId, "de")).data.entryId).toBe(german.data.entryId);
        // A version that's not published falls back to the source.
        expect((await getPageLayout(source.entryId, "fr")).data.entryId).toBe(source.entryId);
        expect(french.data.status).toBe("draft");
        expect((await getPageLayout(source.entryId, "it")).data.entryId).toBe(source.entryId);
        expect((await getPageLayout(source.entryId)).data.entryId).toBe(source.entryId);

        await unpublishLayout(source.entryId);
        expect((await getPageLayout(source.entryId, "fr")).data).toBeNull();
        expect((await getPageLayout(source.entryId, "de")).data.entryId).toBe(german.data.entryId);
    });

    it("sets a published source layout as the default for new pages", async () => {
        await createLanguage("de");
        expect((await run(GET_LAYOUT_SETTINGS)).getLayoutSettings).toEqual({
            data: { defaultLayout: null },
            error: null
        });

        const draft = await createLayout({ properties: { title: "Draft" } });
        expect((await setDefaultLayout(draft.data.entryId)).error.code).toBe(
            "WebsiteBuilder/Layout/ValidationError"
        );
        expect((await setDefaultLayout("missing")).error.code).toBe(
            "WebsiteBuilder/Layout/NotFound"
        );

        const source = await createPublishedLayout("Main");
        const version = await translateLayout(source.entryId, "de");
        await publishLayout(version.data.id);
        expect((await setDefaultLayout(version.data.entryId)).error.code).toBe(
            "WebsiteBuilder/Layout/ValidationError"
        );

        // A revision id is taken as its layout.
        expect(await setDefaultLayout(source.id)).toEqual({
            data: { defaultLayout: source.entryId },
            error: null
        });
        expect((await run(GET_LAYOUT_SETTINGS)).getLayoutSettings.data).toEqual({
            defaultLayout: source.entryId
        });

        const withDefault = await createPage({ path: "/with-default" });
        expect(withDefault.properties.layout).toBe(source.entryId);
        expect(withDefault.layout.entryId).toBe(source.entryId);

        const withoutLayout = await createPage({ path: "/without-layout", layout: null });
        expect(withoutLayout.properties.layout).toBeNull();
        expect(withoutLayout.layout).toBeNull();

        expect(await setDefaultLayout(null)).toEqual({
            data: { defaultLayout: null },
            error: null
        });
        const afterClear = await createPage({ path: "/after-clear" });
        expect(afterClear.properties.layout).toBeUndefined();
    });

    it("delivers a page composed with its layout and global components", async () => {
        const layoutDocument = createLayoutDocument("Layout banner");
        const layout = await createPublishedLayout("Main", {
            properties: { title: "Main" },
            elements: layoutDocument.elements,
            bindings: {
                ...layoutDocument.bindings,
                // The layout's override of the header.
                [HEADER]: {
                    inputs: { subtitle: text("Layout subtitle") },
                    overrides: { tablet: { inputs: { title: text("Layout tablet") } } }
                }
            }
        });
        await saveHeader("Record");

        const pageElements = {
            root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } },
            pageHeaderPlacement: {
                type: "Webiny/Element",
                id: "pageHeaderPlacement",
                component: { name: "Demo/Header" },
                parent: { id: "root", slot: "children" }
            }
        };
        const pageBindings = {
            root: { inputs: {} },
            // The page's overrides of the header, and of the layout's banner.
            [HEADER]: { inputs: { title: text("Page title") } },
            banner: { inputs: { text: text("Page banner") } }
        };
        const page = await createPage(
            { layout: layout.entryId, path: "/composed" },
            { elements: pageElements, bindings: pageBindings }
        );

        const composed = await getPageById(page.id);
        expect(composed.error).toBeNull();
        const record = createHeaderRecord("Record");

        expect(composed.data.elements).toEqual({ ...pageElements, ...record.elements });
        expect(composed.data.bindings[HEADER]).toEqual({
            inputs: {
                title: text("Page title"),
                subtitle: text("Layout subtitle")
            },
            styles: {},
            overrides: {
                tablet: { inputs: { title: text("Layout tablet") }, styles: {} }
            }
        });
        expect(composed.data.bindings.logo).toEqual({ ...record.bindings.logo });
        expect(composed.data.bindings.root).toEqual(pageBindings.root);

        // The layout's own banner gets the page's override.
        expect(composed.data.layout.id).toBe(layout.id);
        expect(composed.data.layout.elements).toEqual(layout.elements);
        expect(composed.data.layout.bindings.banner.inputs.text).toEqual(text("Page banner"));
        expect(composed.data.layout.bindings.root).toEqual(layout.bindings.root);

        // Raw: as stored, with the layout as published.
        const raw = await getPageById(page.id, true);
        expect(raw.data.elements).toEqual(pageElements);
        expect(raw.data.bindings).toEqual(pageBindings);
        expect(raw.data.layout.bindings).toEqual(layout.bindings);

        // By path, published, it's composed the same way.
        await handler.wb.publishPage({ id: page.id });
        const byPath = (await run(GET_PAGE_BY_PATH, { path: "/composed" })).getPageByPath;
        expect(byPath.data.elements).toEqual(composed.data.elements);
        expect(byPath.data.bindings).toEqual(composed.data.bindings);
        expect(byPath.data.layout.bindings).toEqual(composed.data.layout.bindings);
    });

    it("delivers a page in a language with the globals and the layout version of its language", async () => {
        await createLanguage("en", true);
        await createLanguage("de");
        const source = await createPublishedLayout("Main", createLayoutDocument("English"));
        const version = await translateLayout(source.entryId, "de");
        await updateLayout(version.data.id, createLayoutDocument("Deutsch"));
        await publishLayout(version.data.id);

        await saveHeader("Default");
        await saveHeader("Willkommen", "de");

        const german = await createPage({ layout: source.entryId, language: "de", path: "/de" });
        const english = await createPage({ layout: source.entryId, language: "en", path: "/en" });

        const germanPage = (await getPageById(german.id)).data;
        expect(germanPage.layout.entryId).toBe(version.data.entryId);
        expect(germanPage.layout.bindings.banner.inputs.text.static).toBe("Deutsch");
        expect(germanPage.bindings[HEADER].inputs.title.static).toBe("Willkommen");

        const englishPage = (await getPageById(english.id)).data;
        expect(englishPage.layout.entryId).toBe(source.entryId);
        expect(englishPage.bindings[HEADER].inputs.title.static).toBe("Default");
    });

    it("delivers a page without its layout when the layout can't be resolved", async () => {
        const draft = await createLayout({ properties: { title: "Draft" } });
        const page = await createPage({ layout: draft.data.entryId, path: "/draft-layout" });
        expect((await getPageById(page.id)).data.layout).toBeNull();

        const missing = await createPage({ layout: "missing", path: "/missing-layout" });
        expect((await getPageById(missing.id)).data.layout).toBeNull();
    });

    it("stores a page's overrides, never global instances, and responds to an update as stored", async () => {
        const layout = await createPublishedLayout("Main", createLayoutDocument());
        await saveHeader("Record");
        const page = await createPage({ layout: layout.entryId, path: "/edited" });

        const record = createHeaderRecord("Record");
        const override = { inputs: { title: text("Page title") } };
        const updated = (
            await run(UPDATE_PAGE, {
                id: page.id,
                data: {
                    elements: {
                        root: {
                            type: "Webiny/Element",
                            id: "root",
                            component: { name: "Webiny/Root" }
                        },
                        ...record.elements
                    },
                    bindings: { root: { inputs: {} }, [HEADER]: override, banner: override }
                }
            })
        ).updatePage;
        expect(updated.error).toBeNull();
        expect(Object.keys(updated.data.elements)).toEqual(["root"]);
        expect(updated.data.bindings).toEqual({
            root: { inputs: {} },
            [HEADER]: override,
            banner: override
        });

        const context = await useHandler({}).handler();
        const stored = await context.container.resolve(GetPageByIdUseCase).execute(page.id);
        expect(Object.keys(stored.value!.elements)).toEqual(["root"]);
        expect(stored.value!.bindings[HEADER]).toEqual(override);
    });

    it("publishes layout events and dispatches webhooks", async () => {
        const events: string[] = [];
        const dispatched: string[] = [];

        interface EventRecorder {
            handle(event: any): Promise<void>;
        }

        const recorder = (abstraction: any) => {
            class Recorder implements EventRecorder {
                async handle(event: any) {
                    events.push(event.eventType);
                }
            }
            return abstraction.createImplementation({ implementation: Recorder, dependencies: [] });
        };

        handler = useGraphQlHandler({
            legacyPlugins: [
                (container: Container) => {
                    for (const abstraction of [
                        LayoutAfterCreateEventHandler,
                        LayoutAfterUpdateEventHandler,
                        LayoutAfterPublishEventHandler,
                        LayoutAfterUnpublishEventHandler,
                        LayoutAfterDeleteEventHandler,
                        LayoutAfterTranslateEventHandler,
                        LayoutAfterDuplicateEventHandler,
                        LayoutAfterCreateRevisionFromEventHandler
                    ]) {
                        container.register(recorder(abstraction));
                    }
                    container.registerInstance(WebhookDispatcher, {
                        async dispatch(name: string) {
                            dispatched.push(name);
                        }
                    });
                }
            ]
        });

        await createLanguage("de");
        const created = await createLayout({ properties: { title: "Main" } });
        await updateLayout(created.data.id, { properties: { title: "Renamed" } });
        await publishLayout(created.data.id);
        await createRevisionFrom(created.data.id);
        await unpublishLayout(created.data.entryId);
        await duplicateLayout(created.data.entryId);
        await translateLayout(created.data.entryId, "de");
        await deleteLayout(created.data.entryId);

        expect(events).toEqual([
            "layout.afterCreate",
            "layout.afterUpdate",
            "layout.afterPublish",
            "layout.afterCreateRevisionFrom",
            "layout.afterUnpublish",
            // The duplicate is created through the regular create flow.
            "layout.afterCreate",
            "layout.afterDuplicate",
            "layout.afterTranslate",
            // The version, then the source.
            "layout.afterDelete",
            "layout.afterDelete"
        ]);
        expect(dispatched).toEqual([
            "wb.layout.created",
            "wb.layout.updated",
            "wb.layout.published",
            "wb.layout.unpublished",
            "wb.layout.created",
            "wb.layout.created",
            "wb.layout.deleted",
            "wb.layout.deleted"
        ]);
    });

    it("lets page readers read layouts, but not change them", async () => {
        const created = await createLayout({ properties: { title: "Main" } });

        const readerHandler = useGraphQlHandler({
            permissions: [{ name: "wb.page", rwd: "r" }]
        });

        const read = (await run(GET_LAYOUT, { id: created.data.id }, readerHandler)).getLayout;
        expect(read.data.id).toBe(created.data.id);

        const create = await createLayout({ properties: { title: "Other" } }, readerHandler);
        expect(create.error.code).toBe("WebsiteBuilder/Layout/NotAuthorized");

        const update = (
            await run(
                UPDATE_LAYOUT,
                { id: created.data.id, data: { properties: { title: "X" } } },
                readerHandler
            )
        ).updateLayout;
        expect(update.error.code).toBe("WebsiteBuilder/Layout/NotAuthorized");

        const publish = (await run(PUBLISH_LAYOUT, { id: created.data.id }, readerHandler))
            .publishLayout;
        expect(publish.error.code).toBe("WebsiteBuilder/Layout/NotAuthorized");

        const remove = (await run(DELETE_LAYOUT, { id: created.data.entryId }, readerHandler))
            .deleteLayout;
        expect(remove.error.code).toBe("WebsiteBuilder/Layout/NotAuthorized");

        const anonymousHandler = useGraphQlHandler({ identity: null, permissions: [] });
        const anonymous = (await run(LIST_LAYOUTS, {}, anonymousHandler)).listLayouts;
        expect(anonymous.error.code).toBe("WebsiteBuilder/Layout/NotAuthorized");
    });
    it("delivers a published layout by slug, composed with the global components of the language", async () => {
        await createLanguage("en", true);
        await createLanguage("de");
        await createLanguage("fr");
        const layoutDocument = createLayoutDocument("English");
        const source = await createPublishedLayout("Blog", {
            properties: { title: "Blog", slug: "blog" },
            elements: layoutDocument.elements,
            bindings: {
                ...layoutDocument.bindings,
                [HEADER]: { inputs: { subtitle: text("Layout subtitle") } }
            }
        });
        const version = await translateLayout(source.entryId, "de");
        await updateLayout(version.data.id, createLayoutDocument("Deutsch"));
        await publishLayout(version.data.id);

        await saveHeader("Default");
        await saveHeader("Willkommen", "de");

        // Without a language: the source, with the "default" records.
        const plain = await getLayoutBySlug("blog");
        expect(plain.error).toBeNull();
        expect(plain.data.layout.id).toBe(source.id);
        expect(plain.data.layout.bindings.banner.inputs.text.static).toBe("English");
        expect(plain.data.elements).toEqual(createHeaderRecord("Default").elements);
        expect(plain.data.bindings[HEADER].inputs).toEqual({
            title: text("Default"),
            subtitle: text("Layout subtitle")
        });

        // In a language with a published version: that version, with the records of the language.
        const german = await getLayoutBySlug("blog", "de");
        expect(german.data.layout.entryId).toBe(version.data.entryId);
        expect(german.data.layout.bindings.banner.inputs.text.static).toBe("Deutsch");
        expect(german.data.bindings[HEADER].inputs.title.static).toBe("Willkommen");

        // In a language without one: the source, with the records of the site's default language.
        const french = await getLayoutBySlug("blog", "fr");
        expect(french.data.layout.entryId).toBe(source.entryId);
        expect(french.data.bindings[HEADER].inputs.title.static).toBe("Default");

        // A version that isn't published falls back to the source.
        await unpublishLayout(version.data.id);
        expect((await getLayoutBySlug("blog", "de")).data.layout.entryId).toBe(source.entryId);

        // Page readers (e.g. the frontend's API key) can read it.
        const readerHandler = useGraphQlHandler({
            plugins: [createLanguagesPlugin()],
            permissions: [{ name: "wb.page", rwd: "r" }]
        });
        expect((await getLayoutBySlug("blog", "de", readerHandler)).data.layout.id).toBe(source.id);
        const anonymousHandler = useGraphQlHandler({ identity: null, permissions: [] });
        expect((await getLayoutBySlug("blog", undefined, anonymousHandler)).error.code).toBe(
            "WebsiteBuilder/Layout/NotAuthorized"
        );
    });

    it("delivers no layout for a slug no published layout has", async () => {
        expect(await getLayoutBySlug("missing")).toEqual({ data: null, error: null });

        const draft = await createLayout({ properties: { title: "Draft", slug: "draft" } });
        expect(await getLayoutBySlug("draft")).toEqual({ data: null, error: null });

        await publishLayout(draft.data.id);
        expect((await getLayoutBySlug("draft")).data.layout.entryId).toBe(draft.data.entryId);

        await unpublishLayout(draft.data.entryId);
        expect(await getLayoutBySlug("draft")).toEqual({ data: null, error: null });
    });

    it("delivers a layout by its published slug, not a draft's renamed one", async () => {
        const layout = await createPublishedLayout("Blog", {
            properties: { title: "Blog", slug: "blog" }
        });
        const draft = await createRevisionFrom(layout.id);
        await updateLayout(draft.data.id, { properties: { slug: "news" } });

        expect((await getLayoutBySlug("blog")).data.layout.id).toBe(layout.id);
        expect(await getLayoutBySlug("news")).toEqual({ data: null, error: null });
    });

    it("refuses to unpublish or delete a layout a CMS model names, and names the model", async () => {
        const layout = await createPublishedLayout("Blog", {
            properties: { title: "Blog", slug: "blog" }
        });
        const other = await createPublishedLayout("Other", {
            properties: { title: "Other", slug: "other" }
        });
        await createLayoutModel("Article", { previewPath: "/articles/{slug}", layout: "blog" });
        await createLayoutModel("Note", { layout: "missing" });

        const models = [{ modelId: "article", name: "Article" }];
        expect(await getLayoutUsage(layout.id)).toEqual({
            data: { pages: 0, isDefault: false, models },
            error: null
        });

        const unpublished = await unpublishLayout(layout.entryId);
        expect(unpublished).toMatchObject({
            data: null,
            error: {
                code: "WebsiteBuilder/Layout/InUse",
                data: { id: layout.entryId, pages: 0, isDefault: false, models }
            }
        });
        expect(unpublished.error.message).toContain('the "Article" model uses it');
        expect((await deleteLayout(layout.entryId)).error.code).toBe("WebsiteBuilder/Layout/InUse");
        expect((await getLayout(layout.id)).data.status).toBe("published");

        // A language version has no slug: entries fall back to the source without it.
        await createLanguage("en", true);
        await createLanguage("de");
        const version = await translateLayout(layout.entryId, "de");
        await publishLayout(version.data.id);
        expect((await unpublishLayout(version.data.id)).error).toBeNull();

        // A layout no model names can go.
        expect((await getLayoutUsage(other.id)).data.models).toEqual([]);
        expect((await unpublishLayout(other.entryId)).error).toBeNull();
    });
});
