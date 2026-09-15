import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { ListContentModelsTool } from "~/features/ai/ListContentModelsTool.js";
import type { CmsModel } from "~/types/index.js";

const model = (modelId: string, overrides: Partial<CmsModel> = {}): CmsModel =>
    ({
        modelId,
        name: modelId,
        description: null,
        group: "ungrouped",
        singularApiName: modelId,
        pluralApiName: `${modelId}s`,
        titleFieldId: "title",
        fields: [],
        ...overrides
    }) as CmsModel;

const resolveTool = (models: CmsModel[]) => {
    const container = new Container();

    container.registerInstance(ListModelsUseCase, {
        execute: async () => Result.ok(models)
    } as ListModelsUseCase.Interface);

    container.register(ListContentModelsTool);

    const tool = container.resolveAll(AiSdkTool)[0];

    /*
     * The tool is metadata only; the container builds its handler the same way `AiSdkTools` does at
     * call time. Going through `tool.handler` rather than importing the class keeps the wiring under
     * test: a tool that forgot to name its handler fails here.
     */
    return container.resolveImplementation(tool.handler!);
};

describe("listContentModels", () => {
    const models = [
        model("product"),
        // System models Webiny itself owns — flagged by the "hidden" group convention.
        model("wbyLanguage", { group: "hidden" }),
        model("backgroundTaskSettings", { group: "hidden" }),
        // A model another app owns and manages in its own UI.
        model("wbyPage", { isPrivate: true })
    ];

    it("hides system and private models by default", async () => {
        const result = (await resolveTool(models).execute({})) as { modelId: string }[];

        expect(result.map(entry => entry.modelId)).toEqual(["product"]);
    });

    it("includes them when asked", async () => {
        const result = (await resolveTool(models).execute({ includeSystem: true })) as {
            modelId: string;
        }[];

        expect(result.map(entry => entry.modelId)).toEqual([
            "product",
            "wbyLanguage",
            "backgroundTaskSettings",
            "wbyPage"
        ]);
    });

    it("surfaces a use case failure as a thrown error the model can read", async () => {
        const container = new Container();
        container.registerInstance(ListModelsUseCase, {
            execute: async () => Result.fail(new Error("Not allowed to access content models."))
        } as ListModelsUseCase.Interface);
        container.register(ListContentModelsTool);

        const tool = container.resolveAll(AiSdkTool)[0];
        const handler = container.resolveImplementation(tool.handler!);

        await expect(handler.execute({})).rejects.toThrow("Not allowed to access content models.");
    });
});
