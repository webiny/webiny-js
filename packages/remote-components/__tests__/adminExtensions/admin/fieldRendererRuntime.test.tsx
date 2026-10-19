// @vitest-environment jsdom
import React from "react";
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { render as renderInDom } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { Container } from "@webiny/di";
import { FieldRendererEvaluator } from "~/admin/adminExtensions/features/fieldRendererRuntime/abstractions.js";
import { FieldRendererRuntimeFeature } from "~/admin/adminExtensions/features/fieldRendererRuntime/feature.js";
import { FIELD_RENDERER_GLOBAL_NAME } from "~/shared/adminExtensions/fieldRendererRuntime.js";

/*
 * Code in the shape the API's compiler emits: an IIFE assigning `{ default: factory }`. Compiling is
 * covered in Node by the API tests; esbuild-wasm does not load under jsdom, so this file starts from
 * compiled output and covers the admin half: evaluate, inject the runtime, render.
 */
const compiled = (body: string) => `
var ${FIELD_RENDERER_GLOBAL_NAME} = {
    default: function createRenderer(runtime) {
        const { React, createFieldRenderer, Text } = runtime;
        ${body}
        return Renderer;
    }
};`;

const evaluator = () => {
    const container = new Container();
    FieldRendererRuntimeFeature.register(container);
    return container.resolve(FieldRendererEvaluator);
};

// The admin renders everything inside AdminUiProvider; Alert needs it.
const render = (element: React.ReactElement) => {
    return renderInDom(<AdminUiProvider>{element}</AdminUiProvider>);
};

const field = (value: string) =>
    ({
        name: "title",
        label: "Title",
        value,
        validation: { isValid: null },
        onChange: () => undefined,
        onBlur: () => undefined,
        clearFocusRequest: () => undefined
    }) as any;

describe("field renderer runtime", () => {
    it("runs compiled code against the admin's real runtime", () => {
        const code = compiled(`
            const Renderer = createFieldRenderer(({ field }) =>
                React.createElement(Text, null, field.value.length + " characters")
            );
        `);

        const Renderer = evaluator().evaluate(code, "Character count");
        const view = render(<Renderer field={field("Hello")} />);

        expect(view.container.textContent).toContain("5 characters");
    });

    it("keeps a renderer that throws while rendering inside its own field", () => {
        const code = compiled(`
            const Renderer = createFieldRenderer(() => {
                throw new Error("Kaboom");
            });
        `);

        const Renderer = evaluator().evaluate(code, "Broken");
        const view = render(
            <>
                <Renderer field={field("")} />
                <span>Next field</span>
            </>
        );

        expect(view.container.textContent).toContain("Kaboom");
        expect(view.container.textContent).toContain("Next field");
    });

    it("also contains a renderer written without createFieldRenderer", () => {
        const code = compiled(`
            const Renderer = () => {
                throw new Error("Kaboom");
            };
        `);

        const Renderer = evaluator().evaluate(code, "Bare");
        const view = render(<Renderer field={field("")} />);

        expect(view.container.textContent).toContain('"Bare" could not render');
        expect(view.container.textContent).toContain("Kaboom");
    });

    it("refuses code that does not produce a component", () => {
        const code = compiled("const Renderer = undefined;");

        expect(() => evaluator().evaluate(code, "Empty")).toThrow("did not produce a component");
    });

    it("refuses code that does not export a factory", () => {
        const code = `var ${FIELD_RENDERER_GLOBAL_NAME} = {};`;

        expect(() => evaluator().evaluate(code, "Empty")).toThrow("does not export a factory");
    });
});
