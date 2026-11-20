import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Container as DiContainer } from "@webiny/di";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WbAiToolsFeature } from "~/features/ai/feature.js";
import { CreatePageTool } from "~/features/ai/CreatePageTool.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { useHandler } from "./utils/useHandler.js";

/*
 * The test handler runs with AI page generation off, so `WbAiToolsFeature` registers nothing. The
 * tool is registered here; its gate has a test of its own below.
 */
const getHandler = (container: Container, name: string) => {
    container.register(CreatePageTool);
    const tool = container
        .resolveAll(AiSdkToolDefinition)
        .find(candidate => candidate.name === name);

    if (!tool) {
        throw new Error(`Tool "${name}" is not registered.`);
    }

    return { tool, handler: container.resolveImplementation(tool.handler) };
};

const toolNamesWith = (enabledFlags: string[]) => {
    const container = new DiContainer();
    container.registerInstance(FeatureFlags, {
        get: () => ({ isEnabled: (name: string) => enabledFlags.includes(name) })
    } as unknown as FeatureFlags.Interface);
    WbAiToolsFeature.register(container);
    return container.resolveAll(AiSdkToolDefinition).map(tool => tool.name);
};

describe("createPage tool registration", () => {
    it("is registered only with AI page generation licensed", () => {
        expect(toolNamesWith(["aiPowerups.websiteBuilder.pageGeneration"])).toEqual(["createPage"]);
        expect(toolNamesWith(["aiPowerups", "aiPowerups.adminAssistant"])).toEqual([]);
    });
});

describe("createPage tool", () => {
    it("needs approval", async () => {
        const ctx = await useHandler().handler();
        const { tool } = getHandler(ctx.container, "createPage");

        expect(tool.annotations?.readOnlyHint).toBe(false);
    });

    it("creates a draft with a root element and links to it in the editor", async () => {
        const ctx = await useHandler().handler();
        const { handler } = getHandler(ctx.container, "createPage");

        const created = await handler.execute({ title: "Bike Workshop", path: "/bike-workshop" });

        expect(created).toEqual({
            id: expect.any(String),
            title: "Bike Workshop",
            path: "/bike-workshop",
            editorPath: `/website-builder/pages/editor/${encodeURIComponent(created.id)}?assistant=build`
        });

        const page = await ctx.container.resolve(GetPageByIdUseCase).execute(created.id);
        if (page.isFail()) {
            throw page.error;
        }
        // Without the root element, the editor's preview draws nothing that is added to the page.
        expect(page.value.elements).toEqual({
            root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } }
        });
        expect(page.value.status).toBe("draft");
        expect(page.value.location.folderId).toBe("root");
        expect(page.value.metadata).toMatchObject({ documentType: "page", pageType: "static" });
    });

    it("reports what the page use case refused", async () => {
        const ctx = await useHandler({ permissions: [] }).handler();
        const { handler } = getHandler(ctx.container, "createPage");

        await expect(
            handler.execute({ title: "Bike Workshop", path: "/bike-workshop" })
        ).rejects.toThrow(/^Could not create the page: /);
    });
});
