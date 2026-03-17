import { useCallback } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/commands.js";

export function useDeleteElement() {
    const editor = useDocumentEditor();

    const deleteElement = useCallback(
        (id: string) => {
            editor.executeCommand(Commands.DeleteElement, { id });
        },
        [editor]
    );

    return { deleteElement };
}
