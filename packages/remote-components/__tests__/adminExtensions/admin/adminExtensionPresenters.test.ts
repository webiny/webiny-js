import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { makeAutoObservable } from "mobx";
import { AdminAssistantPresenter } from "@webiny/app-admin/features/adminAssistant/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { Identity } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { AdminExtensionsGateway } from "~/admin/adminExtensions/features/gateway/abstractions.js";
import { EnabledExtensionsFeature } from "~/admin/adminExtensions/presentation/EnabledExtensions/feature.js";
import { GeneratedCmsFieldRenderersFeature } from "~/admin/adminExtensions/features/cmsFieldRenderers/feature.js";
import { FieldRendererEvaluator } from "~/admin/adminExtensions/features/fieldRendererRuntime/abstractions.js";
import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import { AdminExtensionListFeature } from "~/admin/adminExtensions/presentation/AdminExtensionList/feature.js";
import { EnabledExtensionsPresenter } from "~/admin/adminExtensions/presentation/EnabledExtensions/abstractions.js";
import { AdminExtensionListPresenter } from "~/admin/adminExtensions/presentation/AdminExtensionList/abstractions.js";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";

const menuDto = (name: string, overrides: Partial<AdminExtensionDto> = {}): AdminExtensionDto => ({
    id: `${name}-id`,
    kind: "menu",
    name,
    label: name,
    description: "",
    enabled: true,
    runtimeVersion: 1,
    source: JSON.stringify({ label: name, to: `/${name}`, parent: "settings", pinnable: true }),
    config: "",
    compiled: "",
    savedOn: "2026-10-19T10:00:00.000Z",
    ...overrides
});

// Keeps extensions in memory, the way the API would: list returns all, listEnabled the enabled.
class InMemoryGateway implements AdminExtensionsGateway.Interface {
    extensions: AdminExtensionDto[] = [];
    calls = 0;

    async listEnabled(kind: AdminExtensionKind) {
        this.calls++;
        return this.extensions.filter(item => item.kind === kind && item.enabled);
    }

    async list() {
        return this.extensions;
    }

    async setEnabled(id: string, enabled: boolean) {
        const index = this.extensions.findIndex(item => item.id === id);
        const updated = { ...this.extensions[index], enabled };
        this.extensions[index] = updated;
        return updated;
    }

    async delete(id: string) {
        this.extensions = this.extensions.filter(item => item.id !== id);
    }
}

const rendererDto = (
    name: string,
    overrides: Partial<AdminExtensionDto> = {}
): AdminExtensionDto => ({
    id: `${name}-id`,
    kind: "fieldRenderer",
    name,
    label: `Label of ${name}`,
    description: `Description of ${name}`,
    enabled: true,
    runtimeVersion: 1,
    source: "const Renderer = createFieldRenderer(() => null);",
    config: JSON.stringify({ fieldType: "text", multipleValues: false }),
    compiled: `compiled ${name}`,
    savedOn: "2026-10-19T10:00:00.000Z",
    ...overrides
});

// Stands in for running compiled code: a component per compiled string, or a throw on "broken".
class StubEvaluator implements FieldRendererEvaluator.Interface {
    evaluate(compiled: string) {
        if (compiled.includes("broken")) {
            throw new Error("Unexpected token.");
        }
        const Component = () => null;
        Component.displayName = compiled;
        return Component;
    }
}

// The part of the assistant presenter the admin watches: the tools each turn has completed.
class FakeAssistant {
    turns: { completed: string[] }[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    get vm() {
        return { turns: this.turns, busy: false };
    }

    complete(tool: string) {
        if (this.turns.length === 0) {
            this.turns.push({ completed: [] });
        }
        this.turns[this.turns.length - 1].completed.push(tool);
    }
}

const textField = { type: "text", list: false } as any;
const numberField = { type: "number", list: false } as any;

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const signIn = (container: Container) => {
    const identity = Identity.createAuthenticated({
        id: "admin",
        type: "admin",
        displayName: "Admin",
        roles: [],
        teams: [],
        permissions: [],
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
    container.resolve(IdentityContext).setIdentity(identity);
};

describe("admin extension presenters", () => {
    let container: Container;
    let gateway: InMemoryGateway;

    beforeEach(() => {
        container = new Container();
        gateway = new InMemoryGateway();
        IdentityContextFeature.register(container);
        container.registerInstance(AdminExtensionsGateway, gateway);
        container.registerInstance(FieldRendererEvaluator, new StubEvaluator());
        GeneratedCmsFieldRenderersFeature.register(container);
        EnabledExtensionsFeature.register(container);
        AdminExtensionListFeature.register(container);
    });

    it("loads menus only once someone signs in, and drops them on sign-out", async () => {
        gateway.extensions = [menuDto("reports")];
        const menus = container.resolve(EnabledExtensionsPresenter);

        menus.start();
        await flush();
        expect(gateway.calls).toBe(0);
        expect(menus.vm.menus).toEqual([]);

        signIn(container);
        await flush();
        expect(menus.vm.menus).toEqual([
            {
                name: "adminExtension.reports",
                label: "reports",
                to: "/reports",
                parent: "settings",
                pinnable: true
            }
        ]);

        container.resolve(IdentityContext).clear();
        await flush();
        expect(menus.vm.menus).toEqual([]);
    });

    it("skips menus from a newer runtime and menus whose source does not parse", async () => {
        gateway.extensions = [
            menuDto("current"),
            menuDto("future", { runtimeVersion: 99 }),
            menuDto("broken", { source: "{ nope" }),
            menuDto("outside", {
                source: JSON.stringify({
                    label: "x",
                    to: "https://example.com",
                    parent: null,
                    pinnable: true
                })
            })
        ];
        signIn(container);
        const menus = container.resolve(EnabledExtensionsPresenter);

        menus.start();
        await flush();

        expect(menus.vm.menus.map(menu => menu.name)).toEqual(["adminExtension.current"]);
    });

    it("updates the sidebar when an extension is disabled or deleted from the list", async () => {
        gateway.extensions = [menuDto("first"), menuDto("second")];
        signIn(container);
        const menus = container.resolve(EnabledExtensionsPresenter);
        const list = container.resolve(AdminExtensionListPresenter);
        menus.start();
        await list.load();

        await list.setEnabled("first-id", false);
        expect(list.vm.rows.find(row => row.id === "first-id")?.enabled).toBe(false);
        expect(menus.vm.menus.map(menu => menu.name)).toEqual(["adminExtension.second"]);

        await list.delete("second-id");
        expect(list.vm.rows.map(row => row.id)).toEqual(["first-id"]);
        expect(menus.vm.menus).toEqual([]);
    });

    it("shows a failed change as an error and keeps the row usable", async () => {
        gateway.extensions = [menuDto("first")];
        gateway.setEnabled = async () => {
            throw new Error("Not authorized to manage admin extensions.");
        };
        const list = container.resolve(AdminExtensionListPresenter);
        await list.load();

        await list.setEnabled("first-id", false);

        expect(list.vm.error).toBe("Not authorized to manage admin extensions.");
        expect(list.vm.rows[0]).toMatchObject({
            enabled: true,
            busy: false,
            kindLabel: "Menu item"
        });
    });
    it("reports a failed delete so the screen does not announce success", async () => {
        gateway.extensions = [menuDto("first")];
        gateway.delete = async () => {
            throw new Error('Admin extension "first-id" was not found.');
        };
        const list = container.resolve(AdminExtensionListPresenter);
        await list.load();

        const deleted = await list.delete("first-id");

        expect(deleted).toBe(false);
        expect(list.vm.rows.map(row => row.id)).toEqual(["first-id"]);
        expect(list.vm.error).toContain("was not found");
    });

    it("ignores a load that finishes after sign-out", async () => {
        gateway.extensions = [menuDto("reports")];
        let release: () => void = () => undefined;
        const listEnabled = gateway.listEnabled.bind(gateway);
        gateway.listEnabled = async kind => {
            await new Promise<void>(resolve => {
                release = resolve;
            });
            return listEnabled(kind);
        };
        const menus = container.resolve(EnabledExtensionsPresenter);
        menus.start();
        signIn(container);
        await flush();

        container.resolve(IdentityContext).clear();
        release();
        await flush();

        expect(menus.vm.menus).toEqual([]);
    });
    it("offers a loaded field renderer to the CMS for matching fields only", async () => {
        gateway.extensions = [rendererDto("char-count")];
        signIn(container);
        const presenter = container.resolve(EnabledExtensionsPresenter);

        presenter.start();
        await flush();

        expect(presenter.vm.fieldRenderers.map(renderer => renderer.formRendererName)).toEqual([
            "adminExtension.char-count"
        ]);
        const entry = container
            .resolveAll(CmsFieldRenderer)
            .find(renderer => renderer.rendererName === "admin-extension-char-count");
        expect(entry).toMatchObject({
            name: "Label of char-count",
            description: "Description of char-count",
            formRenderer: "adminExtension.char-count"
        });
        expect(entry?.canUse({ field: textField, model: {} as any })).toBe(true);
        expect(entry?.canUse({ field: { ...textField, list: true }, model: {} as any })).toBe(
            false
        );
        expect(entry?.canUse({ field: numberField, model: {} as any })).toBe(false);
    });

    it("registers each renderer once, and falls back to the default input once it is disabled", async () => {
        gateway.extensions = [rendererDto("char-count")];
        signIn(container);
        const presenter = container.resolve(EnabledExtensionsPresenter);
        const list = container.resolve(AdminExtensionListPresenter);
        presenter.start();
        await flush();
        await presenter.reload();

        const entries = () =>
            container
                .resolveAll(CmsFieldRenderer)
                .filter(renderer => renderer.rendererName === "admin-extension-char-count");
        expect(entries()).toHaveLength(1);

        await list.load();
        await list.setEnabled("char-count-id", false);

        expect(presenter.vm.fieldRenderers).toEqual([]);
        expect(entries()).toHaveLength(1);
        expect(entries()[0].canUse({ field: textField, model: {} as any })).toBe(false);
        expect(entries()[0].formRenderer).toBe("textInput");
    });

    it("skips a renderer that does not load, from a newer runtime, or with a bad config", async () => {
        gateway.extensions = [
            rendererDto("works"),
            rendererDto("broken", { compiled: "broken" }),
            rendererDto("future", { runtimeVersion: 99 }),
            rendererDto("bad-config", { config: "{}" })
        ];
        signIn(container);
        const presenter = container.resolve(EnabledExtensionsPresenter);

        presenter.start();
        await flush();

        expect(presenter.vm.fieldRenderers.map(renderer => renderer.name)).toEqual(["works"]);
    });
    it("picks up what the assistant changed without a reload", async () => {
        const assistant = new FakeAssistant();
        let cleared = 0;
        container.registerInstance(AdminAssistantPresenter, assistant as any);
        container.registerInstance(ModelsCache, { clear: () => cleared++ } as any);
        signIn(container);
        const presenter = container.resolve(EnabledExtensionsPresenter);
        presenter.start();
        await flush();
        expect(presenter.vm.fieldRenderers).toEqual([]);

        gateway.extensions = [rendererDto("char-count")];
        assistant.complete("describeContentModel");
        await flush();
        expect(presenter.vm.fieldRenderers).toEqual([]);

        assistant.complete("createFieldRenderer");
        await flush();
        expect(presenter.vm.fieldRenderers.map(renderer => renderer.name)).toEqual(["char-count"]);
        expect(cleared).toBe(0);

        assistant.complete("setFieldRenderer");
        await flush();
        expect(cleared).toBe(1);
    });
});
