import { useEffect, useState } from "react";
import { createHeadlessEditor } from "@lexical/headless";
import { EditorStateJSONString } from "~/types";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { $generateHtmlFromNodes } from "@lexical/html";
import { getEmptyEditorStateJSONString } from "~/utils/getEmptyEditorStateJSONString";
import { theme } from "~/themes/webinyLexicalTheme";
import { isValidLexicalData } from "~/utils/isValidLexicalData";

interface UseLexicalNodesToHtmlGenerator {
    html: string;
}

/*
 * Use this hook to generate HTML string from lexical editor state JSON data.
 * Note: This hook is not waiting for eny element to be mounted instead is using headless lexical editor.
 */
export const useLexicalNodesToHtmlGenerator = (
    editorStateData: EditorStateJSONString | null
): UseLexicalNodesToHtmlGenerator => {
    const [html, setHtml] = useState<string>(getEmptyEditorStateJSONString());

    const config = {
        namespace: "webiny",
        nodes: WebinyNodes,
        onError: (error: Error) => {
            throw error;
        },
        theme
    };

    const editorData =
        editorStateData && isValidLexicalData(editorStateData)
            ? editorStateData
            : getEmptyEditorStateJSONString();
    const editor = createHeadlessEditor(config);
    const newEditorState = editor.parseEditorState(editorData);
    editor.setEditorState(newEditorState);

    useEffect(() => {
        editor.update(() => {
            const htmlString = $generateHtmlFromNodes(editor);
            setHtml(htmlString);
        });
    }, [editorStateData]);

    return { html };
};
