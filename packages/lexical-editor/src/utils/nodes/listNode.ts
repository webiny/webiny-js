import type { LexicalNode } from "lexical";

import { $isWebinyListNode, WebinyListNode } from "~/nodes/ListNode/WebinyListNode";
import {
    $createWebinyListItemNode,
    $isWebinyListItemNode,
    WebinyListItemNode
} from "~/nodes/ListNode/WebinyListItemNode";

export function $getListDepth(listNode: WebinyListNode): number {
    let depth = 1;
    let parent = listNode.getParent();

    while (parent !== null) {
        if ($isWebinyListItemNode(parent)) {
            const parentList = parent.getParent();

            if ($isWebinyListNode(parentList)) {
                depth++;
                parent = parentList?.getParent() || null;
                continue;
            }
            console.log("A WebinyListItemNode must have a WebinyListNode for a parent.");
        }

        return depth;
    }

    return depth;
}

export function $getTopListNode(listItem: LexicalNode): WebinyListNode {
    let list = listItem.getParent<WebinyListNode>();

    if (!$isWebinyListNode(list)) {
        console.log("A WebinyListItemNode must have a ListNode for a parent.");
        return listItem as WebinyListNode;
    }

    let parent: WebinyListNode | null = list;

    while (parent !== null) {
        parent = parent.getParent();

        if ($isWebinyListNode(parent)) {
            list = parent;
        }
    }

    return list;
}

export function $getAllListItems(node: WebinyListNode): Array<WebinyListItemNode> {
    let listItemNodes: Array<WebinyListItemNode> = [];
    const listChildren: Array<WebinyListItemNode> = node
        .getChildren()
        .filter($isWebinyListItemNode);

    for (let i = 0; i < listChildren.length; i++) {
        const listItemNode = listChildren[i];
        const firstChild = listItemNode?.getFirstChild();

        if ($isWebinyListNode(firstChild)) {
            listItemNodes = listItemNodes.concat($getAllListItems(firstChild));
        } else {
            listItemNodes.push(listItemNode);
        }
    }

    return listItemNodes;
}

export function isNestedListNode(node: LexicalNode | null | undefined): boolean {
    return $isWebinyListItemNode(node) && $isWebinyListNode(node?.getFirstChild());
}

// TODO: rewrite with $findMatchingParent or *nodeOfType
export function findNearestWebinyListItemNode(node: LexicalNode): WebinyListItemNode | null {
    let currentNode: LexicalNode | null = node;

    while (currentNode !== null) {
        if ($isWebinyListItemNode(currentNode)) {
            return currentNode;
        }
        currentNode = currentNode.getParent();
    }

    return null;
}

export function getUniqueWebinyListItemNodes(
    nodeList: Array<LexicalNode>
): Array<WebinyListItemNode> {
    const keys = new Set<WebinyListItemNode>();

    for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];

        if ($isWebinyListItemNode(node)) {
            keys.add(node);
        }
    }

    return Array.from(keys);
}

export function $removeHighestEmptyListParent(sublist: WebinyListItemNode | WebinyListNode) {
    // Nodes may be repeatedly indented, to create deeply nested lists that each
    // contain just one bullet.
    // Our goal is to remove these (empty) deeply nested lists. The easiest
    // way to do that is crawl back up the tree until we find a node that has siblings
    // (e.g. is actually part of the list contents) and delete that, or delete
    // the root of the list (if no list nodes have siblings.)
    let emptyListPtr = sublist;

    while (emptyListPtr.getNextSibling() == null && emptyListPtr.getPreviousSibling() == null) {
        const parent = emptyListPtr.getParent<WebinyListItemNode | WebinyListNode>();

        if (
            parent == null ||
            !($isWebinyListItemNode(emptyListPtr) || $isWebinyListNode(emptyListPtr))
        ) {
            break;
        }

        emptyListPtr = parent;
    }

    emptyListPtr.remove();
}

export function wrapInListItem(node: LexicalNode): WebinyListItemNode {
    const listItemWrapper = $createWebinyListItemNode();
    return listItemWrapper.append(node);
}
