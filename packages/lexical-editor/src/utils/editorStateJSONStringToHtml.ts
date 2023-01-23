import {$generateHtmlFromNodes} from '@lexical/html';
import {createHeadlessEditor} from '@lexical/headless';
import {WebinyNodes} from "~/nodes/webinyNodes";
import {theme} from "~/themes/webinyLexicalTheme";
import {EditorStateJSONString} from "~/types";
import {Klass, LexicalNode} from "lexical";
export const editorStateJSONStringToHtml = (jsonStringValue: EditorStateJSONString,
                                            onGeneratedHtml: (html: string) => void,
                                            nodes?: Klass<LexicalNode>[]): void => {
    const config = {
        namespace: 'Playground',
        nodes: [...WebinyNodes, ...(nodes || [])],
        onError: (error: Error) => {
            throw error;
        },
        theme: theme,
    };

    const editor = createHeadlessEditor(config);
    const newEditorState = editor.parseEditorState(jsonStringValue);
    editor.setEditorState(newEditorState);
    editor.update(() => {
        const html = $generateHtmlFromNodes(editor);
        onGeneratedHtml(html);
    })
}
