import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CompositionProvider, CompositionScope } from "@webiny/react-composition";
import {
    LexicalEditorWithConfig,
    useLexicalEditorConfig
} from "@webiny/lexical-editor/components/LexicalEditorConfig/LexicalEditorConfig.js";
import { DefaultLexicalConfig } from "./DefaultLexicalConfig.js";
import { LexicalEditorConfig } from "./LexicalEditorConfig.js";

afterEach(cleanup);

// What the scope's editor reads: its toolbar elements, plugins and container.
const Probe = () => {
    const config = useLexicalEditorConfig();
    const summary = {
        elements: config.toolbarElements.map(element => element.name),
        plugins: config.plugins.map(plugin => plugin.name),
        container: config.toolbarContainer?.type ?? null,
        containerClass: (config.toolbarContainer?.element.props as { className?: string })
            ?.className
    };
    return <pre data-testid={"probe"}>{JSON.stringify(summary)}</pre>;
};

const readScope = async (scope: string, config: React.ReactNode) => {
    render(
        <CompositionProvider>
            {config}
            <CompositionScope name={scope}>
                <LexicalEditorWithConfig>
                    <Probe />
                </LexicalEditorWithConfig>
            </CompositionScope>
        </CompositionProvider>
    );
    return JSON.parse((await screen.findByTestId("probe")).textContent!);
};

// The page editor's toolbars before the toolbar contents were extracted (divider2 is named twice).
const EXPANDED_ELEMENTS = [
    "fontSize",
    "fontColor",
    "typography",
    "textAlignment",
    "divider1",
    "boldAction",
    "italic",
    "underline",
    "codeHighlight",
    "divider2",
    "numberedList",
    "bulletList",
    "link",
    "quote"
];
const EXPANDED_PLUGINS = ["fontColor", "list", "typography", "link", "quote", "floatingLinkEditor"];

describe("Website Builder Lexical config", () => {
    it("gives the page editor's expanded editor the same toolbar as before, in the static band", async () => {
        const expanded = await readScope("expanded", <DefaultLexicalConfig />);

        expect(expanded).toEqual({
            elements: EXPANDED_ELEMENTS,
            plugins: EXPANDED_PLUGINS,
            container: "static",
            containerClass: "wb-static-toolbar"
        });
    });

    it("gives the page editor's compact editor the same toolbar as before, in the static band", async () => {
        const compact = await readScope("compact", <DefaultLexicalConfig />);

        expect(compact).toEqual({
            elements: ["textAlignment", "boldAction", "italic", "underline", "expand"],
            plugins: ["fontColor", "list", "typography", "link", "quote"],
            container: "static",
            containerClass: "wb-static-toolbar"
        });
    });

    it("gives a scope the expanded toolbar contents in a floating container", async () => {
        const scoped = await readScope(
            "pac.translations",
            <LexicalEditorConfig.Scope name={"pac.translations"}>
                <LexicalEditorConfig.FloatingToolbar>
                    <LexicalEditorConfig.Expanded.Toolbar />
                </LexicalEditorConfig.FloatingToolbar>
            </LexicalEditorConfig.Scope>
        );

        expect(scoped).toEqual({
            elements: EXPANDED_ELEMENTS,
            plugins: EXPANDED_PLUGINS,
            container: "floating",
            containerClass: "wb-static-toolbar wb-floating-toolbar"
        });
    });

    it("keeps a scope's config to that scope", async () => {
        const expanded = await readScope(
            "expanded",
            <>
                <DefaultLexicalConfig />
                <LexicalEditorConfig.Scope name={"pac.translations"}>
                    <LexicalEditorConfig.FloatingToolbar>
                        <LexicalEditorConfig.Expanded.Toolbar />
                    </LexicalEditorConfig.FloatingToolbar>
                </LexicalEditorConfig.Scope>
            </>
        );

        expect(expanded.container).toBe("static");
    });
});
