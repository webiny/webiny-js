import {
    type ElementMap,
    isGlobalElement,
    type JsonPatchOperation,
    GlobalElementId
} from "@webiny/website-builder-sdk";

// A path segment is a JSON Pointer token: `$global:Demo/Header` arrives as `$global:Demo~1Header`.
const decodePointerToken = (token: string) => {
    return token.replace(/~1/g, "/").replace(/~0/g, "~");
};

// Global instances are saved on their own, so a change that only touches them (and the elements inside
// them) leaves nothing for a document autosave to write: the document's overrides change only when they're
// saved. Undo and redo arrive with an empty diff, and must still be saved.
export const isGlobalOnlyChange = (diff: JsonPatchOperation[], elements: ElementMap) => {
    return (
        diff.length > 0 &&
        diff.every(operation => {
            const [, key, token] = operation.path.split("/");
            if ((key !== "elements" && key !== "bindings") || !token) {
                return false;
            }

            const id = decodePointerToken(token);
            return elements[id] ? isGlobalElement(elements, id) : GlobalElementId.isGlobal(id);
        })
    );
};
