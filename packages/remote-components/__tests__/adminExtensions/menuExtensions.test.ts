import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import type { Container } from "@webiny/di";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolHandlerResolver } from "@webiny/api-core/features/ai/index.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateAdminExtensionUseCase } from "~/api/adminExtensions/features/CreateAdminExtension/abstractions.js";
import { ListEnabledAdminExtensionsUseCase } from "~/api/adminExtensions/features/ListEnabledAdminExtensions/abstractions.js";
import { SetAdminExtensionEnabledUseCase } from "~/api/adminExtensions/features/SetAdminExtensionEnabled/abstractions.js";

const menu = {
    label: "Release notes",
    to: "/release-notes",
    parent: "settings",
    pinnable: true
};

const createMenu = async (container: Container, source: unknown, name = "release-notes") => {
    const useCase = container.resolve(CreateAdminExtensionUseCase);
    return useCase.execute({
        kind: "menu",
        name,
        label: "Release notes",
        source: typeof source === "string" ? source : JSON.stringify(source)
    });
};

const runCreateMenuTool = async (container: Container, input: Record<string, unknown>) => {
    const tools = container.resolveAll(AiSdkToolDefinition);
    const tool = tools.find(candidate => candidate.name === "createMenu");
    if (!tool) {
        throw new Error("createMenu is not registered.");
    }
    const handler = container.resolve(AiSdkToolHandlerResolver).resolve(tool.handler);
    return handler.execute(input);
};

describe("menu extensions", () => {
    const handler = useHandler();

    it("stores a valid menu in a normalized form", async () => {
        const container = await handler.container();

        const result = await createMenu(container, { ...menu, label: "  Release notes  " });

        expect(result.isOk()).toBe(true);
        expect(JSON.parse(result.value.source)).toEqual(menu);
    });

    it.each([
        ["source that is not JSON", "{ label: "],
        ["a full URL", { ...menu, to: "https://example.com" }],
        ["a protocol-relative URL", { ...menu, to: "//example.com" }],
        ["a backslash that browsers read as a slash", { ...menu, to: "/\\example.com" }],
        ["a backslash later in the path", { ...menu, to: "/cms\\..\\x" }],
        ["a relative path", { ...menu, to: "release-notes" }],
        ["an unknown parent", { ...menu, parent: "reports" }],
        ["an empty label", { ...menu, label: " " }],
        ["a missing field", { label: menu.label, to: menu.to, parent: null }],
        ["an unknown field", { ...menu, icon: "star" }]
    ])("rejects %s", async (_, source) => {
        const container = await handler.container();

        const result = await createMenu(container, source);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminExtension/Validation");
    });

    it("accepts a top-level menu", async () => {
        const container = await handler.container();

        const result = await createMenu(container, { ...menu, parent: null });

        expect(result.isOk()).toBe(true);
    });
});

describe("enabled admin extensions", () => {
    it("are listed for any signed-in identity, without the management permission", async () => {
        const manager = useHandler();
        const managerContainer = await manager.container();
        const shown = await createMenu(managerContainer, menu, "shown");
        const hidden = await createMenu(managerContainer, menu, "hidden");
        await managerContainer
            .resolve(SetAdminExtensionEnabledUseCase)
            .execute({ id: hidden.value.id, enabled: false });

        const editor = useHandler({ permissions: [{ name: "cms.*" }] });
        const editorContainer = await editor.container();
        const result = await editorContainer
            .resolve(ListEnabledAdminExtensionsUseCase)
            .execute("menu");

        expect(result.isOk()).toBe(true);
        expect(result.value.map(item => item.id)).toEqual([shown.value.id]);
    });
});

describe("createMenu tool", () => {
    const handler = useHandler();

    it("is registered for the assistant and needs approval", async () => {
        const container = await handler.container();

        const tool = container
            .resolveAll(AiSdkToolDefinition)
            .find(candidate => candidate.name === "createMenu");

        expect(tool?.annotations?.readOnlyHint).toBe(false);
    });

    it("creates a menu extension", async () => {
        const container = await handler.container();

        const created = await runCreateMenuTool(container, {
            name: "release-notes",
            label: "Release notes",
            to: "/release-notes",
            parent: "settings",
            pinnable: true
        });

        expect(created).toMatchObject({ id: expect.any(String), name: "release-notes" });

        const enabled = await container.resolve(ListEnabledAdminExtensionsUseCase).execute("menu");
        expect(enabled.value).toHaveLength(1);
        expect(JSON.parse(enabled.value[0].source)).toEqual(menu);
    });

    it("reports a rejected menu as a tool error the assistant can read", async () => {
        const container = await handler.container();

        const run = runCreateMenuTool(container, {
            name: "release-notes",
            label: "Release notes",
            to: "https://example.com",
            parent: null,
            pinnable: true
        });

        await expect(run).rejects.toThrow(
            "Could not create the menu item: Validation failed. to: Use an admin path"
        );
    });

    it("cannot create a menu for an identity without the permission", async () => {
        const restricted = useHandler({ permissions: [{ name: "cms.*" }] });
        const container = await restricted.container();

        const run = runCreateMenuTool(container, {
            name: "release-notes",
            label: "Release notes",
            to: "/release-notes",
            parent: null,
            pinnable: true
        });

        await expect(run).rejects.toThrow("Not authorized");
    });
});
