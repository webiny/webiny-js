import type { InputAstNode } from "./ComponentManifestToAstConverter.js";

// Visitor signature: called for every resolved leaf
export type InputVisitor = (node: InputAstNode, path: string, value: any) => void;

/**
 * ComponentInputTraverser
 *
 * Walks an input AST and a matching data object,
 * invoking `visitor` for each leaf value found.
 */
export class ComponentInputTraverser {
    private readonly ast: InputAstNode[];

    constructor(ast: InputAstNode[]) {
        this.ast = ast;
    }

    /**
     * Traverse the given `data` object according to the AST,
     * calling `visitor(node, path, value)` for each leaf.
     */
    public traverse(data: Record<string, any>, visitor: InputVisitor): void {
        for (const node of this.ast) {
            const rootValue = data[node.name];
            this.traverseNode(node, rootValue, node.name, visitor);
        }
    }

    private traverseNode(
        node: InputAstNode,
        value: any,
        currentPath: string,
        visitor: InputVisitor
    ): void {
        if (node.list) {
            value = value ?? [];

            if (value.length === 0) {
                visitor(node, currentPath, value);
            }

            value.forEach((item: any, index: number) => {
                if (node.children.length > 0) {
                    const itemPath = `${currentPath}/${index}`;
                    for (const child of node.children) {
                        const childValue = item?.[child.name];
                        const childPath = `${itemPath}/${child.name}`;
                        this.traverseNode(child, childValue, childPath, visitor);
                    }
                } else if (node.type === "slot") {
                    /*
                     * A slot list keeps one path: the elements it holds are managed by `AddToParent`,
                     * which maintains the static array itself. Indexing here would write past it.
                     */
                    visitor(node, currentPath, item);
                } else {
                    /*
                     * An indexed path per item, exactly as an object list gets above.
                     *
                     * This used to pass `currentPath` for every item, so a caller writing one binding
                     * per visit wrote them all to the same path and each overwrote the last: a list of
                     * five came out as the fifth item alone, a bare string on a binding still marked
                     * `list: true`. Every component doing `items.map(...)` then threw, which on a
                     * server-rendered page is a 500 for the whole page rather than one broken section.
                     *
                     * `BindingsResolver` reads a scalar list by collecting `name/0`, `name/1`, … so
                     * the indexed path is also the shape the reader already looks for.
                     */
                    visitor(node, `${currentPath}/${index}`, item);
                }
            });
        } else {
            if (node.children.length > 0) {
                for (const child of node.children) {
                    const childValue = value?.[child.name];
                    const childPath = `${currentPath}/${child.name}`;
                    this.traverseNode(child, childValue, childPath, visitor);
                }
            } else {
                visitor(node, currentPath, value);
            }
        }
    }
}
