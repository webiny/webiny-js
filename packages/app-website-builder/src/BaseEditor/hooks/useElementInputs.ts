import { useCallback } from "react";
import { useSelectFromDocument } from "./useSelectFromDocument.js";
import { useSelectFromEditor } from "./useSelectFromEditor.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { $getElementInputValues } from "~/editorSdk/utils/$getElementInputValues.js";
import { $updateElementInputs } from "~/editorSdk/utils/$updateElementInputs.js";

/**
 * Returns the resolved input values for the given element, plus an updater callback.
 *
 * @param elementId  The element whose inputs to resolve (null returns {}).
 * @param depth      How many levels of slot children to resolve (default 0).
 */
export function useElementInputs<T extends Record<string, any> = Record<string, any>>(
    elementId: string | null,
    depth = 0
) {
    const components = useSelectFromEditor(state => state.components);
    const document = useSelectFromDocument(doc => doc);
    const editor = useDocumentEditor();

    const inputs = $getElementInputValues(document, components, elementId, depth) as T;

    const updateInputs = useCallback(
        (updater: (inputs: T) => void) => {
            if (elementId) {
                $updateElementInputs(
                    editor,
                    elementId,
                    updater as (inputs: Record<string, any>) => void
                );
            }
        },
        [editor, elementId]
    );

    return { inputs, updateInputs };
}
