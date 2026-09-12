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

    return container.resolveAll(AiSdkTool)[0];
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

        await expect(container.resolveAll(AiSdkTool)[0].execute({})).rejects.toThrow(
            "Not allowed to access content models."
        );
    });
});
