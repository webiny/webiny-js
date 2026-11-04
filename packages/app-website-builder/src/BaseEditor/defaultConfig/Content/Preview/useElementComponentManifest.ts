import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { $getEditableElement } from "~/editorSdk/utils/$getEditableElement.js";

export const useElementComponentManifest = (elementId: string) => {
    const editor = useDocumentEditor();
    const document = editor.getDocumentState().read();
    const componentName = $getEditableElement(document, elementId)?.component.name;

    return useSelectFromEditor(
        state => {
            return state.components[componentName];
        },
        [componentName]
    );
};
