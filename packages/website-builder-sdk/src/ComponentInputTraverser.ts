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

            // A list of primitives (e.g. tags) is a single leaf: its value is the whole array.
            // Visiting each item would write every item to the same path, leaving only the last.
            // Slot lists are still visited per item, as each item creates its own element.
            if (node.children.length === 0 && node.type !== "slot") {
                if (value.length > 0) {
                    visitor(node, currentPath, value);
                }
                return;
            }

            value.forEach((item: any, index: number) => {
                if (node.children.length > 0) {
                    const itemPath = `${currentPath}/${index}`;
                    for (const child of node.children) {
                        const childValue = item?.[child.name];
                        const childPath = `${itemPath}/${child.name}`;
                        this.traverseNode(child, childValue, childPath, visitor);
                    }
                } else {
                    visitor(node, currentPath, item);
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
