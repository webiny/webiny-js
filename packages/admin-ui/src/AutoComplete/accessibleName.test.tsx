// @vitest-environment jsdom
/**
 * An autocomplete without a label must not get a made-up accessible name. The label used to go
 * through `String()`, so a missing one named the combobox "undefined".
 */
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminUiContext, type AdminUiContextValue } from "~/AdminUiProvider/AdminUiProvider.js";
import { AutoComplete } from "~/AutoComplete/index.js";
import { MultiAutoComplete } from "~/MultiAutoComplete/index.js";

/* No SVG transform in the test runner: the icons these controls render become empty components. */
vi.mock("@webiny/icons/check.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/close.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/info.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/keyboard_arrow_down.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/keyboard_arrow_up.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/search.svg", () => ({ ReactComponent: () => null }));

const context = {
    compileMarkdown: (markdown: React.ReactNode) => markdown
} as unknown as AdminUiContextValue;

const renderIn = (ui: React.ReactElement) =>
    render(<AdminUiContext.Provider value={context}>{ui}</AdminUiContext.Provider>);

beforeAll(() => {
    /* Radix measures its parts; jsdom has no ResizeObserver. */
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

const options = [
    { label: "Main layout", value: "main" },
    { label: "Landing", value: "landing" }
];

describe("autocomplete accessible name", () => {
    it("AutoComplete — no name when there is no label", () => {
        renderIn(<AutoComplete options={options} onValueChange={() => {}} />);

        expect(screen.getByRole("combobox").getAttribute("aria-label")).not.toBe("undefined");
        expect(screen.queryByText("undefined")).toBeNull();
    });

    it("AutoComplete — the label names the combobox", () => {
        renderIn(<AutoComplete label={"Layout"} options={options} onValueChange={() => {}} />);

        expect(screen.getByRole("combobox", { name: "Layout" })).toBeTruthy();
    });

    it("MultiAutoComplete — no name when there is no label", () => {
        renderIn(<MultiAutoComplete options={options} onValuesChange={() => {}} />);

        expect(screen.getByRole("combobox").getAttribute("aria-label")).not.toBe("undefined");
        expect(screen.queryByText("undefined")).toBeNull();
    });
});
