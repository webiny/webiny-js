import { CreateEditorArgs, LexicalNode } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";

type NodeMapper = ReturnType<typeof $generateNodesFromDOM>;

export interface ParserConfigurationOptions {
    editorConfig?: CreateEditorArgs;
    nodeMapper: (node: LexicalNode) => NodeMapper;
}
