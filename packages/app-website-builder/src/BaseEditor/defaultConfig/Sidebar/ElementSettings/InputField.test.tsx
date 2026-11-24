import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
    ComponentManifestToAstConverter,
    createNumberInput,
    createTextInput
} from "@webiny/website-builder-sdk";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import type { ElementInputRendererProps } from "~/BaseEditor/config/ElementInput.js";
import { InputField } from "./InputField.js";

const requested: string[] = [];

const ShowSettings = (props: ElementInputRendererProps) => (
    <div data-testid={"renderer"}>{JSON.stringify(props.settings)}</div>
);

vi.mock("./useInputRenderer.js", () => ({
    useInputRenderer: (name: string) => {
        requested.push(name);
        return ShowSettings;
    }
}));

vi.mock("./useInputValue.js", () => ({
    useInputValue: () => ({
        value: undefined,
        staticValue: undefined,
        onChange: vi.fn(),
        onPreviewChange: vi.fn(),
        inheritanceMap: undefined,
        metadata: {},
        onReset: vi.fn()
    })
}));

// Only drawn for responsive inputs; its imports reach the admin's root container.
vi.mock("../InheritanceLabel.js", () => ({ InheritanceLabel: () => null }));

const element = {
    id: "el",
    type: "Webiny/Element"
} as unknown as DocumentElement;

const renderField = (input: Parameters<typeof ComponentManifestToAstConverter.convert>[0][0]) => {
    const [node] = ComponentManifestToAstConverter.convert([input]);
    render(<InputField node={node} element={element} bindings={{}} />);
    return screen.getByTestId("renderer").textContent;
};

afterEach(() => {
    cleanup();
    requested.length = 0;
});

describe("InputField", () => {
    it("draws the named renderer with its settings", () => {
        const shown = renderField(
            createNumberInput({
                name: "opacity",
                renderer: {
                    name: "Acme/Slider",
                    settings: { min: 0, max: 100, step: 5 }
                }
            })
        );

        expect(requested).toEqual(["Acme/Slider"]);
        expect(JSON.parse(shown!)).toEqual({ min: 0, max: 100, step: 5 });
    });

    it("gives a renderer named by a string empty settings", () => {
        const shown = renderField(createTextInput({ name: "title" }));

        expect(requested).toEqual(["Webiny/Input"]);
        expect(JSON.parse(shown!)).toEqual({});
    });
});
