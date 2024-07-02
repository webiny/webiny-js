import {
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    ElementNode,
    LexicalNode
} from "lexical";
import { $createLinkNode, $isLinkNode, LinkAttributes, LinkNode } from "~/LinkNode";

/**
 * Generates or updates a LinkNode. It can also delete a LinkNode if the URL is null,
 * but saves any children and brings them up to the parent node.
 * @param url - The URL the link directs to.
 * @param attributes - Optional HTML a tag attributes. { target, rel, title }
 */
export function toggleLink(url: null | string, attributes: LinkAttributes = {}): void {
    const { target, title, alt } = attributes;
    const rel = attributes.rel === undefined ? "noreferrer" : attributes.rel;
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
        return;
    }
    const nodes = selection.extract();

    if (url === null) {
        // Remove LinkNodes
        nodes.forEach(node => {
            const parent = node.getParent();

            if ($isLinkNode(parent)) {
                const children = parent.getChildren();

                for (let i = 0; i < children.length; i++) {
                    parent.insertBefore(children[i]);
                }

                parent.remove();
            }
        });
    } else {
        // Add or merge LinkNodes
        if (nodes.length === 1) {
            const firstNode = nodes[0];
            // if the first node is a LinkNode or if its
            // parent is a LinkNode, we update the URL, target and rel.
            const linkNode = $isLinkNode(firstNode) ? firstNode : $getLinkAncestor(firstNode);
            if (linkNode !== null) {
                linkNode.setURL(url);
                if (target !== undefined) {
                    linkNode.setTarget(target);
                }
                if (rel !== null) {
                    linkNode.setRel(rel);
                }
                if (title !== undefined) {
                    linkNode.setTitle(title);
                }

                if (alt !== undefined) {
                    linkNode.setAlt(alt);
                }
                return;
            }
        }

        let prevParent: ElementNode | LinkNode | null = null;
        let linkNode: LinkNode | null = null;

        nodes.forEach(node => {
            const parent = node.getParent();

            if (
                parent === linkNode ||
                parent === null ||
                ($isElementNode(node) && !node.isInline())
            ) {
                return;
            }

            if ($isLinkNode(parent)) {
                linkNode = parent;
                parent.setURL(url);
                if (target !== undefined) {
                    parent.setTarget(target);
                }
                if (rel !== null) {
                    linkNode.setRel(rel);
                }
                if (title !== undefined) {
                    linkNode.setTitle(title);
                }
                if (alt !== undefined) {
                    linkNode.setAlt(alt);
                }
                return;
            }

            if (!parent.is(prevParent)) {
                prevParent = parent;
                linkNode = $createLinkNode(url, { rel, target, alt });

                if ($isLinkNode(parent)) {
                    if (node.getPreviousSibling() === null) {
                        parent.insertBefore(linkNode);
                    } else {
                        parent.insertAfter(linkNode);
                    }
                } else {
                    node.insertBefore(linkNode);
                }
            }

            if ($isLinkNode(node)) {
                if (node.is(linkNode)) {
                    return;
                }
                if (linkNode !== null) {
                    const children = node.getChildren();

                    for (let i = 0; i < children.length; i++) {
                        linkNode.append(children[i]);
                    }
                }

                node.remove();
                return;
            }

            if (linkNode !== null) {
                linkNode.append(node);
            }
        });
    }
}

function $getLinkAncestor(node: LexicalNode): LinkNode | null {
    const ancestor = $getAncestor(node, $isLinkNode);
    if (!ancestor) {
        return null;
    }

    return ancestor as LinkNode;
}

function $getAncestor<NodeType extends LexicalNode = LexicalNode>(
    node: LexicalNode,
    predicate: (ancestor: LexicalNode) => ancestor is NodeType
): null | LexicalNode {
    let parent: null | LexicalNode = node;
    while (parent !== null && (parent = parent.getParent()) !== null && !predicate(parent)) {}
    return parent;
}
