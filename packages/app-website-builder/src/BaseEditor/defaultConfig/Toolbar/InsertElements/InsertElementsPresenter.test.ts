import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { Editor } from "~/editorSdk/Editor.js";
import { SaveGlobalComponentUseCase } from "~/features/globals/saveGlobalComponent/abstractions.js";
import { ListGlobalComponentsUseCase } from "~/features/globals/listGlobalComponents/abstractions.js";
import { PageGlobalComponentsPresenter } from "~/presentation/pages/PageEditor/GlobalComponents/abstractions.js";
import { PageGlobalComponentsPresenterRegistration } from "~/presentation/pages/PageEditor/GlobalComponents/PageGlobalComponentsPresenter.js";
import { LayoutGlobalComponentsPresenter } from "~/presentation/layouts/LayoutEditor/GlobalComponents/abstractions.js";
import { LayoutGlobalComponentsPresenterRegistration } from "~/presentation/layouts/LayoutEditor/GlobalComponents/LayoutGlobalComponentsPresenter.js";
import { InsertElementsPresenter } from "./abstractions.js";
import { InsertElementsFeature } from "./feature.js";

// The components a website registers: three globals, the layout content areas and ordinary components.
const manifest = (
    name: string,
    label: string,
    rest: Partial<ComponentManifest> = {}
): ComponentManifest => ({ name, label, inputs: [], tags: [], ...rest });

const components = [
    manifest("Site/Header", "Site Header", { group: "basic", global: true }),
    manifest("Site/Footer", "Site Footer", { group: "basic", global: true }),
    manifest("Site/LoginDialog", "Login Dialog", { global: true }),
    manifest("Webiny/LayoutContent", "Main content", { group: "basic", hideFromToolbar: true }),
    manifest("Webiny/NamedContent", "Named content", { group: "basic" }),
    manifest("Site/Heading", "Heading", { group: "basic" }),
    manifest("Site/Banner", "Banner")
];

const groups = {
    basic: { name: "basic", label: "Basic" },
    custom: { name: "custom", label: "Custom" }
};

const element = (id: string, name: string) => ({ type: "Webiny/Element", id, component: { name } });

const createDocument = (documentType: "page" | "layout"): any => ({
    id: `${documentType}#0001`,
    version: 1,
    status: "draft",
    state: {},
    metadata: { documentType },
    extensions: {},
    properties: { language: "en" },
    elements: { root: element("root", "Webiny/Root") },
    bindings: { root: { inputs: { children: { type: "slot", list: true, static: [] } } } }
});

const createEditor = (document: any) => {
    const editor = new Editor(document);
    editor.updateEditor(state => {
        state.componentGroups = { ...groups };
        components.forEach(manifest => {
            state.components[manifest.name] = manifest;
        });
    });
    return editor;
};

const labelsOf = (presenter: InsertElementsPresenter.Interface) => {
    return Object.fromEntries(
        presenter.vm.groups.map(group => [group.label, group.items.map(item => item.label)])
    );
};

describe("InsertElementsPresenter", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        container.registerInstance(SaveGlobalComponentUseCase, { execute: vi.fn() } as any);
        container.registerInstance(Notifications, { warning: vi.fn() } as any);
        container.registerInstance(ListGlobalComponentsUseCase, {
            execute: vi.fn().mockResolvedValue([])
        } as any);
        container.register(PageGlobalComponentsPresenterRegistration);
        container.register(LayoutGlobalComponentsPresenterRegistration);
        InsertElementsFeature.register(container);
    });

    it("lists the globals in a Global group in a new layout, and offers Named content but not Main content", () => {
        const editor = createEditor(createDocument("layout"));
        container.resolve(LayoutGlobalComponentsPresenter).init(editor);
        const { presenter } = InsertElementsFeature.resolve(container);
        presenter.init(editor);

        expect(presenter.vm.groups.map(group => group.name)).toEqual(["global", "basic", "custom"]);
        expect(labelsOf(presenter)).toEqual({
            Global: ["Site Header", "Site Footer", "Login Dialog"],
            Basic: ["Named content", "Heading"],
            Custom: ["Banner"]
        });
    });

    it("lists the globals in a Global group in a new page, and offers neither Main content nor Named content", () => {
        const pageGlobals = container.resolve(PageGlobalComponentsPresenter);
        const editor = createEditor(pageGlobals.prepare(createDocument("page"), []));
        pageGlobals.init(editor);
        const { presenter } = InsertElementsFeature.resolve(container);
        presenter.init(editor);

        expect(presenter.vm.groups.map(group => group.name)).toEqual(["global", "basic", "custom"]);
        expect(labelsOf(presenter)).toEqual({
            Global: ["Site Header", "Site Footer", "Login Dialog"],
            Basic: ["Heading"],
            Custom: ["Banner"]
        });
    });

    it("lists no Global group in an editor that doesn't offer global components", () => {
        const editor = createEditor(createDocument("page"));
        const { presenter } = InsertElementsFeature.resolve(container);
        presenter.init(editor);

        expect(presenter.vm.groups.map(group => group.label)).toEqual(["Basic", "Custom"]);
    });

    it("shows only the components matching the search, and leaves out groups without any", () => {
        const editor = createEditor(createDocument("layout"));
        container.resolve(LayoutGlobalComponentsPresenter).init(editor);
        const { presenter } = InsertElementsFeature.resolve(container);
        presenter.init(editor);

        presenter.setSearch("  SITE ");
        expect(labelsOf(presenter)).toEqual({ Global: ["Site Header", "Site Footer"] });

        presenter.setSearch("");
        presenter.setView("grid");
        expect(presenter.vm.view).toBe("grid");
        expect(presenter.vm.groups).toHaveLength(3);
    });
});
