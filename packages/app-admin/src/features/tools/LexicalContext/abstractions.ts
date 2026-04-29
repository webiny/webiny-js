import type { Klass, LexicalNode, LexicalNodeReplacement, EditorThemeClasses } from "lexical";
import { createAbstraction } from "@webiny/feature/admin";

export interface ILexicalContext {
    getNodes(): ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>;
    setNodes(nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>): void;
    getTheme(): EditorThemeClasses | undefined;
    setTheme(theme: EditorThemeClasses): void;
}

export const LexicalContext = createAbstraction<ILexicalContext>("LexicalContext");

export namespace LexicalContext {
    export type Interface = ILexicalContext;
}
