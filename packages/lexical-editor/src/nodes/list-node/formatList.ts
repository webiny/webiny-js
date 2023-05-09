import {
    $getSelection,
    $isElementNode,
    $isLeafNode,
    $isParagraphNode,
    $isRangeSelection,
    $isRootOrShadowRoot,
    DEPRECATED_$isGridSelection,
    ElementNode,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    ParagraphNode
} from "lexical";
import { $createWebinyListNode, $isWebinyListNode, WebinyListNode } from "./WebinyListNode";
import {
    $getAllListItems,
    $getTopListNode,
    $removeHighestEmptyListParent,
    findNearestWebinyListItemNode,
    getUniqueWebinyListItemNodes,
    isNestedListNode
} from "~/utils/nodes/list-node";
import { $getNearestNodeOfType } from "@lexical/utils";
import {
    $createWebinyListItemNode,
    $isWebinyListItemNode,
    WebinyListItemNode
} from "~/nodes/list-node/WebinyListItemNode";
import { ListType } from "@lexical/list";
import { $createBaseParagraphNode } from "~/nodes/BaseParagraphNode";

const DEFAULT_LIST_START_NUMBER = 1;

function $isSelectingEmptyListItem(
    anchorNode: WebinyListItemNode | LexicalNode,
    nodes: Array<LexicalNode>
): boolean {
    return (
        $isWebinyListItemNode(anchorNode) &&
        (nodes.length === 0 ||
            (nodes.length === 1 && anchorNode.is(nodes[0]) && anchorNode.getChildrenSize() === 0))
    );
}

function $getListItemValue(listItem: WebinyListItemNode): number {
    const list = listItem.getParent();

    let value = 1;

    if (list !== null) {
        if (!$isWebinyListNode(list)) {
            console.log(
                "$getListItemValue: webiny list node is not parent of webiny list item node"
            );
            return DEFAULT_LIST_START_NUMBER;
        } else {
            value = list.getStart();
        }
    }

    const siblings = listItem.getPreviousSiblings();
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];

        if ($isWebinyListItemNode(sibling) && !$isWebinyListNode(sibling.getFirstChild())) {
            value++;
        }
    }
    return value;
}

export function insertList(editor: LexicalEditor, listType: ListType, styleId: string): void {
    editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
            const nodes = selection.getNodes();
            const anchor = selection.anchor;
            const anchorNode = anchor.getNode();
            const anchorNodeParent = anchorNode.getParent();

            if ($isSelectingEmptyListItem(anchorNode, nodes)) {
                const list = $createWebinyListNode(listType, styleId);

                if ($isRootOrShadowRoot(anchorNodeParent)) {
                    anchorNode.replace(list);
                    const listItem = $createWebinyListItemNode();
                    if ($isElementNode(anchorNode)) {
                        listItem.setFormat(anchorNode.getFormatType());
                        listItem.setIndent(anchorNode.getIndent());
                    }
                    list.append(listItem);
                } else if ($isWebinyListItemNode(anchorNode)) {
                    const parent = anchorNode.getParentOrThrow();
                    append(list, parent.getChildren());
                    parent.replace(list);
                }

                return;
            } else {
                const handled = new Set();
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];

                    if ($isElementNode(node) && node.isEmpty() && !handled.has(node.getKey())) {
                        createListOrMerge(node, listType, styleId);
                        continue;
                    }

                    if ($isLeafNode(node)) {
                        let parent = node.getParent();
                        while (parent != null) {
                            const parentKey = parent.getKey();

                            if ($isWebinyListNode(parent)) {
                                if (!handled.has(parentKey)) {
                                    const newListNode = $createWebinyListNode(listType, styleId);
                                    append(newListNode, parent.getChildren());
                                    parent.replace(newListNode);
                                    updateChildrenListItemValue(newListNode);
                                    handled.add(parentKey);
                                }

                                break;
                            } else {
                                const nextParent = parent.getParent();

                                if ($isRootOrShadowRoot(nextParent) && !handled.has(parentKey)) {
                                    handled.add(parentKey);
                                    createListOrMerge(parent, listType, styleId);
                                    break;
                                }

                                parent = nextParent;
                            }
                        }
                    }
                }
            }
        }
    });
}

function append(node: ElementNode, nodesToAppend: Array<LexicalNode>) {
    node.splice(node.getChildrenSize(), 0, nodesToAppend);
}

function createListOrMerge(node: ElementNode, listType: ListType, styleId: string): WebinyListNode {
    if ($isWebinyListNode(node)) {
        return node;
    }

    const previousSibling = node.getPreviousSibling();
    const nextSibling = node.getNextSibling();
    const listItem = $createWebinyListItemNode();
    listItem.setFormat(node.getFormatType());
    listItem.setIndent(node.getIndent());
    append(listItem, node.getChildren());

    if ($isWebinyListNode(previousSibling) && listType === previousSibling.getListType()) {
        previousSibling.append(listItem);
        node.remove();
        // if the same type of list is on both sides, merge them.

        if ($isWebinyListNode(nextSibling) && listType === nextSibling.getListType()) {
            append(previousSibling, nextSibling.getChildren());
            nextSibling.remove();
        }
        return previousSibling;
    } else if ($isWebinyListNode(nextSibling) && listType === nextSibling.getListType()) {
        nextSibling.getFirstChildOrThrow().insertBefore(listItem);
        node.remove();
        return nextSibling;
    } else {
        const list = $createWebinyListNode(listType, styleId);
        list.append(listItem);
        node.replace(list);
        updateChildrenListItemValue(list);
        return list;
    }
}

export function removeList(editor: LexicalEditor): void {
    editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
            const listNodes = new Set<WebinyListNode>();
            const nodes = selection.getNodes();
            const anchorNode = selection.anchor.getNode();

            if ($isSelectingEmptyListItem(anchorNode, nodes)) {
                listNodes.add($getTopListNode(anchorNode));
            } else {
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];

                    if ($isLeafNode(node)) {
                        const WebinyListItemNode = $getNearestNodeOfType(node, WebinyListNode);

                        if (WebinyListItemNode != null) {
                            listNodes.add($getTopListNode(WebinyListItemNode));
                        }
                    }
                }
            }

            for (const listNode of listNodes) {
                let insertionPoint: WebinyListNode | ParagraphNode = listNode;

                const listItems = $getAllListItems(listNode);

                for (const WebinyListItemNode of listItems) {
                    const paragraph = $createBaseParagraphNode();

                    append(paragraph, WebinyListItemNode.getChildren());

                    insertionPoint.insertAfter(paragraph);
                    insertionPoint = paragraph;

                    // When the anchor and focus fall on the textNode
                    // we don't have to change the selection because the textNode will be appended to
                    // the newly generated paragraph.
                    // When selection is in empty nested list item, selection is actually on the WebinyListItemNode.
                    // When the corresponding WebinyListItemNode is deleted and replaced by the newly generated paragraph
                    // we should manually set the selection's focus and anchor to the newly generated paragraph.
                    if (WebinyListItemNode.__key === selection.anchor.key) {
                        selection.anchor.set(paragraph.getKey(), 0, "element");
                    }
                    if (WebinyListItemNode.__key === selection.focus.key) {
                        selection.focus.set(paragraph.getKey(), 0, "element");
                    }

                    WebinyListItemNode.remove();
                }
                listNode.remove();
            }
        }
    });
}

export function updateChildrenListItemValue(
    list: WebinyListNode,
    children?: Array<LexicalNode>
): void {
    const childrenOrExisting = children || list.getChildren();
    if (childrenOrExisting !== undefined) {
        for (let i = 0; i < childrenOrExisting.length; i++) {
            const child = childrenOrExisting[i];
            if ($isWebinyListItemNode(child)) {
                const prevValue = child.getValue();
                const nextValue = $getListItemValue(child);

                if (prevValue !== nextValue) {
                    child.setValue(nextValue);
                }
            }
        }
    }
}

export function $handleIndent(WebinyListItemNodes: Array<WebinyListItemNode>): void {
    // go through each node and decide where to move it.
    const removed = new Set<NodeKey>();

    WebinyListItemNodes.forEach((WebinyListItemNode: WebinyListItemNode) => {
        if (isNestedListNode(WebinyListItemNode) || removed.has(WebinyListItemNode.getKey())) {
            return;
        }

        const parent = WebinyListItemNode.getParent();

        // We can cast both of the below `isNestedListNode` only returns a boolean type instead of a user-defined type guards
        const nextSibling =
            WebinyListItemNode.getNextSibling<WebinyListItemNode>() as WebinyListItemNode;
        const previousSibling =
            WebinyListItemNode.getPreviousSibling<WebinyListItemNode>() as WebinyListItemNode;
        // if there are nested lists on either side, merge them all together.

        if (isNestedListNode(nextSibling) && isNestedListNode(previousSibling)) {
            const innerList = previousSibling.getFirstChild();

            if ($isWebinyListNode(innerList)) {
                innerList.append(WebinyListItemNode);
                const nextInnerList = nextSibling.getFirstChild();

                if ($isWebinyListNode(nextInnerList)) {
                    const children = nextInnerList.getChildren();
                    append(innerList, children);
                    nextSibling.remove();
                    removed.add(nextSibling.getKey());
                }
                updateChildrenListItemValue(innerList);
            }
        } else if (isNestedListNode(nextSibling)) {
            // if the WebinyListItemNode is next to a nested ListNode, merge them
            const innerList = nextSibling.getFirstChild();

            if ($isWebinyListNode(innerList)) {
                const firstChild = innerList.getFirstChild();

                if (firstChild !== null) {
                    firstChild.insertBefore(WebinyListItemNode);
                }
                updateChildrenListItemValue(innerList);
            }
        } else if (isNestedListNode(previousSibling)) {
            const innerList = previousSibling.getFirstChild();

            if ($isWebinyListNode(innerList)) {
                innerList.append(WebinyListItemNode);
                updateChildrenListItemValue(innerList);
            }
        } else {
            // otherwise, we need to create a new nested ListNode

            if ($isWebinyListNode(parent)) {
                const newListItem = $createWebinyListItemNode();
                const newList = $createWebinyListNode(parent.getListType(), parent.getStyleId());
                newListItem.append(newList);
                newList.append(WebinyListItemNode);

                if (previousSibling) {
                    previousSibling.insertAfter(newListItem);
                } else if (nextSibling) {
                    nextSibling.insertBefore(newListItem);
                } else {
                    parent.append(newListItem);
                }
            }
        }

        if ($isWebinyListNode(parent)) {
            updateChildrenListItemValue(parent);
        }
    });
}

export function $handleOutdent(WebinyListItemNodes: Array<WebinyListItemNode>): void {
    // go through each node and decide where to move it.

    WebinyListItemNodes.forEach(WebinyListItemNode => {
        if (isNestedListNode(WebinyListItemNode)) {
            return;
        }
        const parentList = WebinyListItemNode.getParent();
        const grandparentListItem = parentList ? parentList.getParent() : undefined;
        const greatGrandparentList = grandparentListItem
            ? grandparentListItem.getParent()
            : undefined;
        // If it doesn't have these ancestors, it's not indented.

        if (
            $isWebinyListNode(greatGrandparentList) &&
            $isWebinyListItemNode(grandparentListItem) &&
            $isWebinyListNode(parentList)
        ) {
            // if it's the first child in it's parent list, insert it into the
            // great grandparent list before the grandparent
            const firstChild = parentList ? parentList.getFirstChild() : undefined;
            const lastChild = parentList ? parentList.getLastChild() : undefined;

            if (WebinyListItemNode.is(firstChild)) {
                grandparentListItem.insertBefore(WebinyListItemNode);

                if (parentList.isEmpty()) {
                    grandparentListItem.remove();
                }
                // if it's the last child in it's parent list, insert it into the
                // great grandparent list after the grandparent.
            } else if (WebinyListItemNode.is(lastChild)) {
                grandparentListItem.insertAfter(WebinyListItemNode);

                if (parentList.isEmpty()) {
                    grandparentListItem.remove();
                }
            } else {
                // otherwise, we need to split the siblings into two new nested lists
                const listType = parentList.getListType();
                const themeStyleId = parentList.getStyleId();
                const previousSiblingsListItem = $createWebinyListItemNode();
                const previousSiblingsList = $createWebinyListNode(listType, themeStyleId);
                previousSiblingsListItem.append(previousSiblingsList);
                WebinyListItemNode.getPreviousSiblings().forEach(sibling =>
                    previousSiblingsList.append(sibling)
                );
                const nextSiblingsListItem = $createWebinyListItemNode();
                const nextSiblingsList = $createWebinyListNode(listType, themeStyleId);
                nextSiblingsListItem.append(nextSiblingsList);
                append(nextSiblingsList, WebinyListItemNode.getNextSiblings());
                // put the sibling nested lists on either side of the grandparent list item in the great grandparent.
                grandparentListItem.insertBefore(previousSiblingsListItem);
                grandparentListItem.insertAfter(nextSiblingsListItem);
                // replace the grandparent list item (now between the siblings) with the outdented list item.
                grandparentListItem.replace(WebinyListItemNode);
            }
            updateChildrenListItemValue(parentList);
            updateChildrenListItemValue(greatGrandparentList);
        }
    });
}

function maybeIndentOrOutdent(direction: "indent" | "outdent"): void {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
        return;
    }
    const selectedNodes = selection.getNodes();
    let webinyListItemNodes: Array<WebinyListItemNode> = [];

    if (selectedNodes.length === 0) {
        selectedNodes.push(selection.anchor.getNode());
    }

    if (selectedNodes.length === 1) {
        // Only 1 node selected. Selection may not contain the ListNodeItem so we traverse the tree to
        // find whether this is part of a WebinyListItemNode
        const nearestWebinyListItemNode = findNearestWebinyListItemNode(selectedNodes[0]);

        if (nearestWebinyListItemNode !== null) {
            webinyListItemNodes = [nearestWebinyListItemNode];
        }
    } else {
        webinyListItemNodes = getUniqueWebinyListItemNodes(selectedNodes);
    }

    if (webinyListItemNodes.length > 0) {
        if (direction === "indent") {
            $handleIndent(webinyListItemNodes);
        } else {
            $handleOutdent(webinyListItemNodes);
        }
    }
}

export function indentList(): void {
    maybeIndentOrOutdent("indent");
}

export function outdentList(): void {
    maybeIndentOrOutdent("outdent");
}

export function $handleListInsertParagraph(): boolean {
    const selection = $getSelection();

    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return false;
    }

    // Only run this code on empty list items
    const anchor = selection.anchor.getNode();

    if (!$isWebinyListItemNode(anchor) || anchor.getTextContent() !== "") {
        return false;
    }
    const topListNode = $getTopListNode(anchor);
    const parent = anchor.getParent();

    if (!$isWebinyListNode(parent)) {
        console.log("A WebinyListItemNode must have a WebinyListNode for a parent.");
        return false;
    }

    const grandparent = parent?.getParent() || null;

    let replacementNode;

    if ($isRootOrShadowRoot(grandparent)) {
        replacementNode = $createBaseParagraphNode();
        topListNode.insertAfter(replacementNode);
    } else if ($isWebinyListItemNode(grandparent)) {
        replacementNode = $createWebinyListItemNode();
        grandparent.insertAfter(replacementNode);
    } else {
        return false;
    }
    replacementNode.select();

    const nextSiblings = anchor.getNextSiblings();

    if (nextSiblings.length > 0) {
        const newList = $createWebinyListNode(parent?.getListType(), parent?.getStyleId());

        if ($isParagraphNode(replacementNode)) {
            replacementNode.insertAfter(newList);
        } else {
            const newListItem = $createWebinyListItemNode();
            newListItem.append(newList);
            replacementNode.insertAfter(newListItem);
        }
        nextSiblings.forEach(sibling => {
            sibling.remove();
            newList.append(sibling);
        });
    }

    // Don't leave hanging nested empty lists
    $removeHighestEmptyListParent(anchor);

    return true;
}
