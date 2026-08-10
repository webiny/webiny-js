import { EditorProvider as EditorProviderAbstraction } from "./abstractions.js";

class EditorProviderImpl implements EditorProviderAbstraction.Interface {
    private editor: any = null;

    getEditor() {
        return this.editor;
    }

    setEditor(editor: any) {
        this.editor = editor;
    }
}

export const EditorProvider = EditorProviderAbstraction.createImplementation({
    implementation: EditorProviderImpl,
    dependencies: []
});
