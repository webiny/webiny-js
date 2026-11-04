import type { IFieldVM, IObjectFieldVM } from "~/features/formModel/abstractions.js";

/**
 * Reactively checks whether any field in `fields`, or (recursively) any child
 * of a nested object field, currently has `focusRequested === true`.
 *
 * Reads the `focusRequested` observable on every visited field so that callers
 * wrapped in a mobx `observer` re-render (and can force-open their accordion /
 * dynamic-zone container) when a focus request lands anywhere in the subtree.
 * This lets "jump to field" cascade open collapsed ancestors top-down, even
 * for fields nested several levels deep inside repeatable/list objects.
 */
export const hasSubtreeFocusRequest = (fields: IFieldVM[]): boolean => {
    for (const field of fields) {
        // Read the observable first so this stays reactive even when a shallow
        // match short-circuits later fields.
        if (field.focusRequested) {
            return true;
        }

        if (field.type === "object") {
            const objectField = field as IObjectFieldVM;
            if (objectField.isList) {
                for (const item of objectField.items) {
                    if (hasSubtreeFocusRequest(item.fields)) {
                        return true;
                    }
                }
            } else if (hasSubtreeFocusRequest(objectField.fields)) {
                return true;
            }
        }
    }

    return false;
};
