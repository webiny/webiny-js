import { CreateEditorArgs, LexicalEditor, LexicalNode } from "lexical";

export type NodeMapper = (node: LexicalNode, editor?: LexicalEditor) => LexicalNode;

export interface ParserConfigurationOptions {
    editorConfig?: CreateEditorArgs;
    nodeMapper?: NodeMapper;
    normalizeTextNodes?: boolean;
}
