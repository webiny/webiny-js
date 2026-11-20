import { describe, expect, it } from "vitest";
import * as editor from "~/exports/admin/website-builder/page/editor.js";
import { Editor } from "~/editorSdk/Editor.js";
import { DocumentEditor } from "~/DocumentEditor/index.js";
import { ThemeProvider } from "~/BaseEditor/components/ThemeProvider.js";
import { ElementInputRenderers } from "~/BaseEditor/defaultConfig/ElementInputRenderers.js";
import { BreakpointSelector } from "~/BaseEditor/defaultConfig/Content/AddressBar/BreakpointSelector.js";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { CommandHandlers } from "~/BaseEditor/commandHandlers/index.js";
import { Layout } from "~/BaseEditor/config/Layout.js";

describe("public page editor exports", () => {
    it("export the editor pieces an admin extension embeds as their source symbols", () => {
        expect(editor.Editor).toBe(Editor);
        expect(editor.DocumentEditor).toBe(DocumentEditor);
        expect(editor.ThemeProvider).toBe(ThemeProvider);
        expect(editor.ElementInputRenderers).toBe(ElementInputRenderers);
        expect(editor.BreakpointSelector).toBe(BreakpointSelector);
        expect(editor.useBreakpoint).toBe(useBreakpoint);
        expect(editor.CommandHandlers).toBe(CommandHandlers);
    });

    it("reach the editor layout through PageEditorConfig rather than an export of its own", () => {
        expect(editor.PageEditorConfig.Ui.Layout).toBe(Layout);
        expect("Layout" in editor).toBe(false);
    });
});
