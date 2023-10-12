import { CreateEditorArgs, LexicalNode } from "lexical";

export type NodeMapper = (node: LexicalNode) => LexicalNode;

export interface ParserConfigurationOptions {
    editorConfig?: CreateEditorArgs;
    nodeMapper?: NodeMapper;
    normalizeTextNodes?: boolean;
}
