import { useSelectFromDocument } from "./useSelectFromDocument.js";
import { useSelectFromEditor } from "./useSelectFromEditor.js";
import { $getElementInputValues } from "~/editorSdk/utils/$getElementInputValues.js";

/**
 * Returns the resolved input values for the given element.
 *
 * @param elementId  The element whose inputs to resolve (null returns {}).
 * @param depth      How many levels of slot children to resolve (default 0).
 */
export function useElementInputValues(elementId: string | null, depth = 0) {
    const components = useSelectFromEditor(state => state.components);
    const document = useSelectFromDocument(doc => doc);

    return $getElementInputValues(document, components, elementId, depth);
}
