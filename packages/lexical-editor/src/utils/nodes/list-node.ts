import type { LexicalNode } from "lexical";

import { $isWebinyListNode, BaseListNode } from "~/nodes/list-node/BaseListNode";
import {
    $createWebinyListItemNode,
    $isWebinyListItemNode,
    BaseListItemNode
} from "~/nodes/list-node/BaseListItemNode";

export function $getListDepth(listNode: BaseListNode): number {
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

export function $getTopListNode(listItem: LexicalNode): BaseListNode {
    let list = listItem.getParent<BaseListNode>();

    if (!$isWebinyListNode(list)) {
        console.log("A WebinyListItemNode must have a ListNode for a parent.");
        return listItem as BaseListNode;
    }

    let parent: BaseListNode | null = list;

    while (parent !== null) {
        parent = parent.getParent();

        if ($isWebinyListNode(parent)) {
            list = parent;
        }
    }

    return list;
}

export function $getAllListItems(node: BaseListNode): Array<BaseListItemNode> {
    let listItemNodes: Array<BaseListItemNode> = [];
    const listChildren: Array<BaseListItemNode> = node.getChildren().filter($isWebinyListItemNode);

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
export function findNearestWebinyListItemNode(node: LexicalNode): BaseListItemNode | null {
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
): Array<BaseListItemNode> {
    const keys = new Set<BaseListItemNode>();

    for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];

        if ($isWebinyListItemNode(node)) {
            keys.add(node);
        }
    }

    return Array.from(keys);
}

export function $removeHighestEmptyListParent(sublist: BaseListItemNode | BaseListNode) {
    // Nodes may be repeatedly indented, to create deeply nested lists that each
    // contain just one bullet.
    // Our goal is to remove these (empty) deeply nested lists. The easiest
    // way to do that is crawl back up the tree until we find a node that has siblings
    // (e.g. is actually part of the list contents) and delete that, or delete
    // the root of the list (if no list nodes have siblings.)
    let emptyListPtr = sublist;

    while (emptyListPtr.getNextSibling() == null && emptyListPtr.getPreviousSibling() == null) {
        const parent = emptyListPtr.getParent<BaseListItemNode | BaseListNode>();

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

export function wrapInListItem(node: LexicalNode): BaseListItemNode {
    const listItemWrapper = $createWebinyListItemNode();
    return listItemWrapper.append(node);
}
