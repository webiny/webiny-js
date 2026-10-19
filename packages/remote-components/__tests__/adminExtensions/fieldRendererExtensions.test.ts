import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import type { Container } from "@webiny/di";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CHAR_COUNT_INPUT } from "~tests/helpers/fieldRendererFixtures.js";
import { CHAR_COUNT_SOURCE } from "~tests/helpers/fieldRendererFixtures.js";
import { CreateAdminExtensionUseCase } from "~/api/adminExtensions/features/CreateAdminExtension/abstractions.js";
import { SetAdminExtensionEnabledUseCase } from "~/api/adminExtensions/features/SetAdminExtensionEnabled/abstractions.js";
import { SetModelFieldRendererUseCase } from "~/api/adminExtensions/features/SetModelFieldRenderer/abstractions.js";
import { FIELD_RENDERER_GLOBAL_NAME } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import { FIELD_RENDERER_RUNTIME_NAMES } from "~/shared/adminExtensions/fieldRendererRuntime.js";

const createRenderer = async (
    container: Container,
    input: Partial<CreateAdminExtensionUseCase.Input> = {}
) => {
    return container
        .resolve(CreateAdminExtensionUseCase)
        .execute({ ...CHAR_COUNT_INPUT, ...input });
};

const createArticleModel = async (container: Container) => {
    const group = await container.resolve(CreateGroupUseCase).execute({
        name: "Content",
        slug: "content",
        description: "",
        icon: { type: "emoji", name: "thumbs_up", value: "👍" }
    });
    if (group.isFail()) {
        throw group.error;
    }
    const model = await container.resolve(CreateModelUseCase).execute({
        name: "Article",
        modelId: "article",
        singularApiName: "Article",
        pluralApiName: "Articles",
        description: "",
        group: group.value.slug,
        fields: [
            {
                id: "titleId",
                fieldId: "title",
                type: "text",
                label: "Title",
                renderer: { name: "text-input" }
            },
            {
                id: "viewsId",
                fieldId: "views",
                type: "number",
                label: "Views",
                renderer: { name: "number-input" }
            }
        ],
        layout: [["titleId"], ["viewsId"]],
        titleFieldId: "title"
    });
    if (model.isFail()) {
        throw model.error;
    }
    return model.value;
};

// Evaluates compiled output the way the admin does, with a stub for every runtime name.
const evaluate = (compiled: string, runtime: Record<string, unknown>) => {
    const load = new Function(`${compiled}\nreturn ${FIELD_RENDERER_GLOBAL_NAME}.default;`);
    const factory = load() as (runtime: Record<string, unknown>) => unknown;
    return factory(runtime);
};

describe("field renderer extensions", () => {
    const handler = useHandler();

    it("compiles the source when it is saved and keeps both", async () => {
        const container = await handler.container();

        const result = await createRenderer(container);

        expect(result.isOk()).toBe(true);
        expect(result.value.source).toBe(CHAR_COUNT_SOURCE);
        expect(JSON.parse(result.value.config)).toEqual({
            fieldType: "text",
            multipleValues: false
        });
        expect(result.value.compiled).toContain(FIELD_RENDERER_GLOBAL_NAME);
        expect(result.value.compiled).not.toContain(": string");
    });

    it("compiles to a factory that returns what the source passed to createFieldRenderer", async () => {
        const container = await handler.container();
        const { value } = await createRenderer(container);

        const runtime: Record<string, unknown> = {};
        for (const name of FIELD_RENDERER_RUNTIME_NAMES) {
            runtime[name] = name;
        }
        runtime.createFieldRenderer = (render: unknown) => ({ render });

        const renderer = evaluate(value.compiled, runtime) as { render: unknown };

        expect(typeof renderer.render).toBe("function");
    });

    it.each([
        ["an import", `import React from "react";\n${CHAR_COUNT_SOURCE}`, "Remove import"],
        ["an export", `export ${CHAR_COUNT_SOURCE.trim()}`, "Remove import"],
        ["no Renderer", "const Field = createFieldRenderer(() => null);", "const Renderer"],
        ["a syntax error", "const Renderer = createFieldRenderer(() => <div>);", "Does not compile"]
    ])("rejects source with %s", async (_, source, message) => {
        const container = await handler.container();

        const result = await createRenderer(container, { source });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminExtension/Validation");
        expect(result.error.message).toContain(message);
    });

    it("points a compile error at the line of the stored source", async () => {
        const container = await handler.container();
        const source = [
            "const Renderer = createFieldRenderer(({ field }) => {",
            "    return <div>;",
            "});"
        ].join("\n");

        const result = await createRenderer(container, { source });

        expect(result.error.message).toMatch(/^Does not compile, line [23]:/);
    });

    it.each([
        ["no config", undefined],
        ["an unsupported field type", JSON.stringify({ fieldType: "ref", multipleValues: false })],
        ["a missing multipleValues", JSON.stringify({ fieldType: "text" })]
    ])("rejects %s", async (_, config) => {
        const container = await handler.container();

        const result = await createRenderer(container, { config });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminExtension/Validation");
    });

    it("registers both tools for the assistant, each needing approval", async () => {
        const container = await handler.container();

        const tools = container.resolveAll(AiSdkToolDefinition);
        const names = ["createFieldRenderer", "setFieldRenderer"];

        for (const name of names) {
            const tool = tools.find(candidate => candidate.name === name);
            expect(tool?.annotations?.readOnlyHint).toBe(false);
        }
    });
});

describe("applying a field renderer to a model field", () => {
    const handler = useHandler();

    it("stores the renderer on the field", async () => {
        const container = await handler.container();
        await createArticleModel(container);
        await createRenderer(container);

        const result = await container.resolve(SetModelFieldRendererUseCase).execute({
            modelId: "article",
            fieldId: "title",
            rendererName: "char-count"
        });

        expect(result.value).toEqual({
            modelId: "article",
            fieldId: "title",
            cmsRendererName: "admin-extension-char-count"
        });
        const model = await container.resolve(GetModelUseCase).execute("article");
        const title = model.value.fields.find(field => field.fieldId === "title");
        const views = model.value.fields.find(field => field.fieldId === "views");
        expect(title?.renderer).toMatchObject({ name: "admin-extension-char-count" });
        expect(views?.renderer).toMatchObject({ name: "number-input" });
    });

    it("refuses a field of another type", async () => {
        const container = await handler.container();
        await createArticleModel(container);
        await createRenderer(container);

        const result = await container.resolve(SetModelFieldRendererUseCase).execute({
            modelId: "article",
            fieldId: "views",
            rendererName: "char-count"
        });

        expect(result.error.code).toBe("AdminExtension/Validation");
        expect(result.error.message).toContain("renders text fields");
    });

    it("refuses an unknown field, an unknown renderer and a disabled one", async () => {
        const container = await handler.container();
        await createArticleModel(container);
        const created = await createRenderer(container);
        const apply = container.resolve(SetModelFieldRendererUseCase);

        const unknownField = await apply.execute({
            modelId: "article",
            fieldId: "subtitle",
            rendererName: "char-count"
        });
        const unknownRenderer = await apply.execute({
            modelId: "article",
            fieldId: "title",
            rendererName: "word-count"
        });
        await container
            .resolve(SetAdminExtensionEnabledUseCase)
            .execute({ id: created.value.id, enabled: false });
        const disabled = await apply.execute({
            modelId: "article",
            fieldId: "title",
            rendererName: "char-count"
        });

        expect(unknownField.error.code).toBe("AdminExtension/Validation");
        expect(unknownRenderer.error.code).toBe("AdminExtension/NotFound");
        expect(disabled.error.code).toBe("AdminExtension/NotFound");
    });

    it("reports a missing model as a failed model update", async () => {
        const container = await handler.container();
        await createRenderer(container);

        const result = await container.resolve(SetModelFieldRendererUseCase).execute({
            modelId: "article",
            fieldId: "title",
            rendererName: "char-count"
        });

        expect(result.error.code).toBe("AdminExtension/ModelUpdate");
    });
});
