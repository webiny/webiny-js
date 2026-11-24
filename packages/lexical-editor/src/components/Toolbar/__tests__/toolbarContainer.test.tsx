// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import { createTheme } from "@webiny/lexical-theme";
import { RichTextEditor } from "~/components/Editor/RichTextEditor.js";
import { LexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig.js";

const theme = createTheme({ colors: [], typography: {}, lexicalTokenPrefix: "lx", fontSizes: [] });

const Editor = ({ config }: { config?: React.ReactNode }) => {
    return (
        <CompositionProvider>
            <LexicalEditorConfig>
                {/* A config the probe below waits for, so it knows the config has been read. */}
                <LexicalEditorConfig.Plugin
                    name={"probe"}
                    element={<div data-testid={"ready"} />}
                />
                {config}
            </LexicalEditorConfig>
            <RichTextEditor
                value={null}
                theme={theme}
                staticToolbar={<div data-testid={"static-prop"} />}
                toolbar={<div data-testid={"toolbar-prop"} />}
            />
        </CompositionProvider>
    );
};

describe("The toolbar container", () => {
    afterEach(cleanup);

    it("is the editor's props when config doesn't set one, as before", async () => {
        render(<Editor />);

        await screen.findByTestId("ready");
        await screen.findByTestId("static-prop");
        await screen.findByTestId("toolbar-prop");
    });

    it("is the config's static container, in place of both props", async () => {
        render(
            <Editor
                config={
                    <LexicalEditorConfig.ToolbarContainer
                        type={"static"}
                        element={<div data-testid={"static-config"} />}
                    />
                }
            />
        );

        await screen.findByTestId("static-config");
        expect(screen.queryByTestId("static-prop")).toBeNull();
        expect(screen.queryByTestId("toolbar-prop")).toBeNull();
    });

    it("is the config's floating container, in place of both props", async () => {
        render(
            <Editor
                config={
                    <LexicalEditorConfig.ToolbarContainer
                        type={"floating"}
                        element={<div data-testid={"floating-config"} />}
                    />
                }
            />
        );

        await screen.findByTestId("floating-config");
        await waitFor(() => expect(screen.queryByTestId("static-prop")).toBeNull());
        expect(screen.queryByTestId("toolbar-prop")).toBeNull();
    });
});
