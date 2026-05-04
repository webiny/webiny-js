import type { Klass, LexicalNode, LexicalNodeReplacement, EditorThemeClasses } from "lexical";
import { LexicalContext as Abstraction } from "./abstractions.js";

class LexicalContextImpl implements Abstraction.Interface {
    private nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> = [];
    private theme: EditorThemeClasses | undefined;

    getNodes(): ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> {
        return this.nodes;
    }

    setNodes(nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>): void {
        this.nodes = nodes;
    }

    getTheme(): EditorThemeClasses | undefined {
        return this.theme;
    }

    setTheme(theme: EditorThemeClasses): void {
        this.theme = theme;
    }
}

export const LexicalContext = Abstraction.createImplementation({
    implementation: LexicalContextImpl,
    dependencies: []
});
