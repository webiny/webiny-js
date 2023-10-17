/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createLinkNode, $isLinkNode, LinkNode, LinkNodeAttributes } from "~/nodes/LinkNode";
import {
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    ElementNode,
    LexicalNode
} from "lexical";
import { $isLinkNode as $isBaseLinkNode, LinkNode as BaseLinkNode } from "@lexical/link";

const updateLinkNode = (
    linkNode: LexicalNode | LinkNode | null,
    url: string,
    attrs: LinkNodeAttributes
): LexicalNode | null => {
    if (linkNode === null) {
        return null;
    }

    const { rel, target, alt, title } = attrs;

    if ($isLinkNode(linkNode)) {
        if (linkNode) {
            linkNode.setURL(url);
        }
        if (target !== undefined) {
            linkNode.setTarget(target);
        }
        if (rel) {
            linkNode.setRel(rel);
        }
        if (title) {
            linkNode.setTitle(title);
        }
        if (alt) {
            linkNode.setAlt(alt);
        }
        return linkNode;
    }

    /**
     * BACKWARDS COMPATIBILITY: replace legacy link node(native Lexical node) with our custom link node.
     */
    if (isLegacyLinkNode(linkNode)) {
        const customLinkNode = $createLinkNode(url, { rel, target, alt, title });
        (linkNode as BaseLinkNode).replace(customLinkNode, true);
        return linkNode;
    }
    return null;
};

const isLegacyLinkNode = (node: LexicalNode): boolean => {
    return $isBaseLinkNode(node);
};

/**
 * This implementation of the 'toggleLink' function is taken from the lexical's repository.
 * Link: https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/index.ts#L419
 *
 * Changes: added 'updateLinkNode' and 'isLegacyLinkNode' methods to replace the
 * native Lexical link node type 'link', to our custom LinkNode type 'link-node'.
 *
 * Generates or updates a LinkNode. It can also delete a LinkNode if the URL is null,
 * but saves any children and brings them up to the parent node.
 * @param url - The URL the link directs to.
 * @param attributes - Optional HTML a tag attributes. { target, rel, title }
 */
export function toggleLink(url: null | string, attributes: LinkNodeAttributes = {}): void {
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
            const parent = firstNode.getParent();
            // if the first node is a LinkNode or if its
            // parent is a LinkNode, we update the URL, target and rel.
            const linkNode = $isLinkNode(firstNode) ? firstNode : $getLinkAncestor(firstNode);
            const updatedLinkNode = updateLinkNode(linkNode ?? parent, url, {
                title,
                alt,
                target,
                rel
            });
            if (updatedLinkNode) {
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

            const updatedNode = updateLinkNode(parent, url, { rel, alt, target, title });
            if (updatedNode !== null) {
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

function $getLinkAncestor(node: LexicalNode): null | LexicalNode {
    return $getAncestor(node, $isLinkNode);
}

function $getAncestor<NodeType extends LexicalNode = LexicalNode>(
    node: LexicalNode,
    predicate: (ancestor: LexicalNode) => ancestor is NodeType
): null | LexicalNode {
    let parent: null | LexicalNode = node;
    while (parent !== null && (parent = parent.getParent()) !== null && !predicate(parent)) {}
    return parent;
}
