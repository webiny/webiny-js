import { useCallback } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/commands.js";
import type { CommandPayload } from "~/editorSdk/createCommand.js";

export function useCreateElement() {
    const editor = useDocumentEditor();

    const createElement = useCallback(
        (payload: CommandPayload<typeof Commands.CreateElement>) => {
            editor.executeCommand(Commands.CreateElement, payload);
        },
        [editor]
    );

    return { createElement };
}
