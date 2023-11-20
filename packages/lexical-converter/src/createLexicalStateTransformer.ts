import {
    CreateEditorArgs,
    LexicalEditor,
    SerializedEditorState,
    $getRoot,
    $createNodeSelection,
    $isElementNode,
    LexicalNode
} from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { createHeadlessEditor } from "@lexical/headless";
import { allNodes } from "@webiny/lexical-nodes";

interface LexicalStateTransformerConfig {
    editorConfig?: Pick<CreateEditorArgs, "nodes" | "theme">;
}

export type FlatStateWithHTML = Array<{ node: LexicalNode; html: string }>;

class LexicalStateTransformer {
    private readonly editor: LexicalEditor;

    constructor(config: LexicalStateTransformerConfig = {}) {
        this.editor = createHeadlessEditor({
            ...config.editorConfig,
            nodes: [...allNodes, ...(config.editorConfig?.nodes || [])]
        });
    }

    public flatten(state: string | SerializedEditorState) {
        const editorState = this.editor.parseEditorState(state);
        this.editor.setEditorState(editorState);

        let flattenedNodes: FlatStateWithHTML = [];

        this.editor.update(() => {
            const children = $getRoot().getChildren();

            flattenedNodes = children.map(childNode => {
                const selection = $createNodeSelection();
                selection.add(childNode.getKey());

                this.getNodeDescendants(childNode).forEach(node => {
                    selection.add(node.getKey());
                });

                const html = $generateHtmlFromNodes(this.editor, selection);

                return {
                    node: childNode,
                    html
                };
            });
        });

        return flattenedNodes;
    }

    public toHtml(state: string | SerializedEditorState) {
        const editorState = this.editor.parseEditorState(state);
        this.editor.setEditorState(editorState);

        let html = "";

        this.editor.update(() => {
            html = $generateHtmlFromNodes(this.editor);
        });

        return html;
    }

    private getNodeDescendants(node: LexicalNode): LexicalNode[] {
        if (!$isElementNode(node)) {
            return [];
        }
        const children = node.getChildren();
        return [...children, ...children.map(child => this.getNodeDescendants(child)).flat()];
    }
}

export const createLexicalStateTransformer = (config?: LexicalStateTransformerConfig) => {
    return new LexicalStateTransformer(config);
};
