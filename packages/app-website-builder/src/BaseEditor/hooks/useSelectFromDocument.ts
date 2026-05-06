import deepEqual from "deep-equal";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromState } from "./useSelectFromState.js";

type Equals<T> = (a: T, b: T) => boolean;

export type { EditorDocument };

/**
 * Subscribe to part of the document state.
 * @param selector   Pick the slice of state you care about.
 * @param equals     (optional) comparator, defaults to Object.is
 */
export function useSelectFromDocument<TReturn, TDocument extends EditorDocument>(
    selector: (doc: TDocument) => TReturn,
    deps: React.DependencyList = [],
    equals: Equals<TReturn> = deepEqual
): TReturn {
    const editor = useDocumentEditor<TDocument>();

    return useSelectFromState(
        () => editor.getDocumentState().read(),
        selector,
        [editor, editor.getDocumentState().read(), ...deps],
        equals
    );
}
