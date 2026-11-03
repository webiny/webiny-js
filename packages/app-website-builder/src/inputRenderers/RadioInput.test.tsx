import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
    ComponentManifestToAstConverter,
    createColorInput,
    createRadioInput,
    createTextInput
} from "@webiny/website-builder-sdk";
import type { DocumentElement, InputAstNode } from "@webiny/website-builder-sdk";
import { AdminUiProvider } from "@webiny/admin-ui";
import { RadioInputRenderer } from "./RadioInput.js";

vi.mock("~/BaseEditor/defaultConfig/Sidebar/ElementSettings/InputField.js", () => ({
    InputField: ({ node }: { node: InputAstNode }) => (
        <div data-testid={"field"}>{`${node.path}: ${node.input.label}`}</div>
    )
}));

const layout = createRadioInput({
    name: "layout",
    label: "Layout",
    defaultValue: "1",
    options: [
        {
            value: "1",
            label: "One",
            inputs: [
                createTextInput({ name: "header", label: "Headline" }),
                createColorInput({ name: "arrow", label: "Button arrow" })
            ]
        },
        {
            value: "3",
            label: "Three",
            inputs: [
                createTextInput({ name: "header", label: "Headline" }),
                createColorInput({ name: "arrow", label: "Button" })
            ]
        }
    ]
});

const element = { id: "el", type: "Webiny/Element" } as unknown as DocumentElement;

const renderRadio = (node: InputAstNode, bindings: Record<string, any>, value?: any) => {
    const writes: unknown[] = [];
    const onChange = vi.fn(cb => {
        const holder = {
            current: value,
            get() {
                return this.current;
            },
            set(next: unknown) {
                this.current = next;
                writes.push(next);
            }
        };
        cb({ value: holder, metadata: {} });
    });
    render(
        <AdminUiProvider>
            <RadioInputRenderer
                label={node.input.label}
                metadata={{} as any}
                value={value}
                onChange={onChange}
                onPreviewChange={vi.fn()}
                input={node.input}
                settings={node.renderer.settings}
                node={node}
                element={element}
                bindings={bindings}
            />
        </AdminUiProvider>
    );
    return writes;
};

afterEach(() => cleanup());

describe("RadioInputRenderer", () => {
    it("draws the selected option's inputs with that option's labels", () => {
        const [node] = ComponentManifestToAstConverter.convert([layout]);

        renderRadio(node, { "layout/value": { id: "v", static: "3", type: "radio" } });

        expect(screen.getAllByTestId("field").map(field => field.textContent)).toEqual([
            "layout/header: Headline",
            "layout/arrow: Button"
        ]);
    });

    it("falls back to the default option and writes only the value on a switch", () => {
        const [node] = ComponentManifestToAstConverter.convert([layout]);
        const writes = renderRadio(node, {}, { value: "1", header: "Hi", arrow: "#fff" });

        expect(screen.getAllByTestId("field").map(field => field.textContent)).toEqual([
            "layout/header: Headline",
            "layout/arrow: Button arrow"
        ]);

        fireEvent.click(screen.getByLabelText("Three"));

        expect(writes).toEqual([{ value: "3", header: "Hi", arrow: "#fff" }]);
    });

    it("keeps a radio without option inputs a plain choice", () => {
        const [node] = ComponentManifestToAstConverter.convert([
            createRadioInput({
                name: "alignment",
                label: "Alignment",
                options: [
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" }
                ]
            })
        ]);
        const writes = renderRadio(node, {}, "left");

        expect(screen.queryAllByTestId("field")).toEqual([]);
        fireEvent.click(screen.getByLabelText("Center"));
        expect(writes).toEqual(["center"]);
    });
});
