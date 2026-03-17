import { useCallback } from "react";
import { useSelectFromDocument } from "./useSelectFromDocument.js";
import { useSelectFromEditor } from "./useSelectFromEditor.js";
import { useUpdateElement } from "./useUpdateElement.js";
import { $getElementInputValues } from "~/editorSdk/utils/$getElementInputValues.js";

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
    const { updateElement } = useUpdateElement();

    // Compute inputs inside the selector so MobX tracks the specific observable
    // reads (elements, bindings, state) and triggers rerenders on changes.
    const inputs = useSelectFromDocument(
        doc => $getElementInputValues(doc, components, elementId, depth) as T,
        [components, elementId, depth]
    );

    const updateInputs = useCallback(
        (updater: (inputs: T) => void) => {
            if (elementId) {
                updateElement<T>(elementId, updater);
            }
        },
        [updateElement, elementId]
    );

    return { inputs, updateInputs };
}
