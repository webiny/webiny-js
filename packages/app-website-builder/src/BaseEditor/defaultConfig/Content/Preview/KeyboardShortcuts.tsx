import { useCallback, useEffect } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useKeyHandler } from "~/BaseEditor/hooks/useKeyHandler.js";
import { $getActiveElementId } from "~/editorSdk/utils/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const KeyboardShortcuts = () => {
    const editor = useDocumentEditor();
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    const deleteActiveElement = useCallback(() => {
        const activeElementId = $getActiveElementId(editor);
        if (activeElementId) {
            editor.executeCommand(Commands.DeleteElement, { id: activeElementId });
        }
    }, []);

    const deactivateElement = useCallback(() => {
        editor.executeCommand(Commands.DeselectElement);
    }, []);

    useEffect(() => {
        addKeyHandler("Escape", e => {
            e.preventDefault();
            deactivateElement();
        });

        addKeyHandler("Backspace", e => {
            e.preventDefault();
            deleteActiveElement();
        });

        addKeyHandler("Delete", e => {
            e.preventDefault();
            deleteActiveElement();
        });

        addKeyHandler("mod+z", e => {
            e.preventDefault();
            editor.undo();
        });

        addKeyHandler("mod+shift+z", e => {
            e.preventDefault();
            editor.redo();
        });

        return () => {
            removeKeyHandler("Escape");
            removeKeyHandler("Backspace");
            removeKeyHandler("Delete");
            removeKeyHandler("mod+z");
            removeKeyHandler("mod+shift+z");
        };
    }, []);

    return null;
};
