import type { LexicalNode, Spread } from "lexical";

import { $isListNode, ListNode } from "~/ListNode";
import { $createListItemNode, $isListItemNode, ListItemNode } from "~/ListItemNode";

export function $getListDepth(listNode: ListNode): number {
    let depth = 1;
    let parent = listNode.getParent();

    while (parent !== null) {
        if ($isListItemNode(parent)) {
            const parentList = parent.getParent();

            if ($isListNode(parentList)) {
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

export function $getTopListNode(listItem: LexicalNode): ListNode {
    let list = listItem.getParent<ListNode>();

    if (!$isListNode(list)) {
        console.log("A WebinyListItemNode must have a ListNode for a parent.");
        return listItem as ListNode;
    }

    let parent: ListNode | null = list;

    while (parent !== null) {
        parent = parent.getParent();

        if ($isListNode(parent)) {
            list = parent;
        }
    }

    return list;
}

export function $getAllListItems(node: ListNode): Array<ListItemNode> {
    let listItemNodes: Array<ListItemNode> = [];
    const listChildren: Array<ListItemNode> = node.getChildren().filter($isListItemNode);

    for (let i = 0; i < listChildren.length; i++) {
        const listItemNode = listChildren[i];
        const firstChild = listItemNode?.getFirstChild();

        if ($isListNode(firstChild)) {
            listItemNodes = listItemNodes.concat($getAllListItems(firstChild));
        } else {
            listItemNodes.push(listItemNode);
        }
    }

    return listItemNodes;
}

const NestedListNodeBrand: unique symbol = Symbol.for("@lexical/NestedListNodeBrand");

/**
 * Checks to see if the passed node is a ListItemNode and has a ListNode as a child.
 * @param node - The node to be checked.
 * @returns true if the node is a ListItemNode and has a ListNode child, false otherwise.
 */
export function isNestedListNode(
    node: LexicalNode | null | undefined
): node is Spread<{ getFirstChild(): ListNode; [NestedListNodeBrand]: never }, ListItemNode> {
    return $isListItemNode(node) && $isListNode(node.getFirstChild());
}

// TODO: rewrite with $findMatchingParent or *nodeOfType
export function findNearestListItemNode(node: LexicalNode): ListItemNode | null {
    let currentNode: LexicalNode | null = node;

    while (currentNode !== null) {
        if ($isListItemNode(currentNode)) {
            return currentNode;
        }
        currentNode = currentNode.getParent();
    }

    return null;
}

export function getUniqueListItemNodes(nodeList: Array<LexicalNode>): Array<ListItemNode> {
    const keys = new Set<ListItemNode>();

    for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];

        if ($isListItemNode(node)) {
            keys.add(node);
        }
    }

    return Array.from(keys);
}

export function $removeHighestEmptyListParent(sublist: ListItemNode | ListNode) {
    // Nodes may be repeatedly indented, to create deeply nested lists that each
    // contain just one bullet.
    // Our goal is to remove these (empty) deeply nested lists. The easiest
    // way to do that is crawl back up the tree until we find a node that has siblings
    // (e.g. is actually part of the list contents) and delete that, or delete
    // the root of the list (if no list nodes have siblings.)
    let emptyListPtr = sublist;

    while (emptyListPtr.getNextSibling() == null && emptyListPtr.getPreviousSibling() == null) {
        const parent = emptyListPtr.getParent<ListItemNode | ListNode>();

        if (parent == null || !($isListItemNode(emptyListPtr) || $isListNode(emptyListPtr))) {
            break;
        }

        emptyListPtr = parent;
    }

    emptyListPtr.remove();
}

export function wrapInListItem(node: LexicalNode): ListItemNode {
    const listItemWrapper = $createListItemNode();
    return listItemWrapper.append(node);
}
