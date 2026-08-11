import { useCallback } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { Commands } from "~/BaseEditor/index.js";

export type ThemeMode = "light" | "dark";

/**
 * The light/dark mode the editor canvas is previewed in.
 *
 * The mode is editor UI state (like the breakpoint), but unlike the breakpoint it has to reach *into*
 * the preview iframe: the theme's `--wby-*` variables live on the iframe document's `:root`, keyed off
 * `data-wby-theme-mode`. So setting it also forwards a message the preview SDK applies to the attribute.
 */
export const useThemeMode = () => {
    const editor = useDocumentEditor();
    const stored = useSelectFromEditor<ThemeMode | undefined>(
        state => state.themeMode as ThemeMode | undefined
    );

    const setThemeMode = useCallback(
        (mode: ThemeMode) => {
            editor.updateEditor(state => {
                state.themeMode = mode;
            });
            editor.executeCommand(Commands.SendPreviewMessage, {
                type: "theme.mode",
                payload: { mode }
            });
        },
        [editor]
    );

    return {
        themeMode: stored ?? "light",
        /** False until a mode has been chosen (by the initial sync or the user). */
        isSet: stored !== undefined,
        setThemeMode
    };
};
