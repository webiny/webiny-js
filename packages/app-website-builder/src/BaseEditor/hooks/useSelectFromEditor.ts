import isEqual from "lodash/isEqual.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { EditorState } from "~/editorSdk/Editor.js";
import { useSelectFromState } from "~/BaseEditor/hooks/useSelectFromState.js";

type Equals<T> = (a: T, b: T) => boolean;

/**
 * Subscribe to part of the document state.
 * @param selector   Pick the slice of state you care about.
 * @param equals     (optional) comparator, defaults to a strict structural compare
 *                   (`lodash/isEqual`), cheap enough to run for every subscribed sidebar input
 */
export function useSelectFromEditor<T>(
    selector: (doc: EditorState) => T,
    deps: React.DependencyList = [],
    equals: Equals<T> = isEqual
): T {
    const editor = useDocumentEditor();

    return useSelectFromState(
        () => editor.getEditorState().read(),
        selector,
        [editor, ...deps],
        equals
    );
}
