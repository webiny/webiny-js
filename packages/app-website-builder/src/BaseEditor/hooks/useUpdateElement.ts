import { useCallback } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { $updateElementInputs } from "~/editorSdk/utils/$updateElementInputs.js";

export function useUpdateElement() {
    const editor = useDocumentEditor();

    const updateElement = useCallback(
        <T extends Record<string, any> = Record<string, any>>(
            elementId: string,
            updater: (inputs: T) => void
        ) => {
            $updateElementInputs(
                editor,
                elementId,
                updater as (inputs: Record<string, any>) => void
            );
        },
        [editor]
    );

    return { updateElement };
}
