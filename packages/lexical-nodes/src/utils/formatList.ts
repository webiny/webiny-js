import {
    $getSelection,
    $isElementNode,
    $isLeafNode,
    $isParagraphNode,
    $isRangeSelection,
    $isRootOrShadowRoot,
    ElementNode,
    LexicalEditor,
    LexicalNode,
    NodeKey
} from "lexical";
import { $createListNode, $isListNode, ListNode } from "~/ListNode";
import { $getNearestNodeOfType } from "@lexical/utils";
import { $createListItemNode, $isListItemNode, ListItemNode } from "~/ListItemNode";
import { ListType } from "@lexical/list";
import { $createParagraphNode, ParagraphNode } from "~/ParagraphNode";
import {
    $getAllListItems,
    $getTopListNode,
    $removeHighestEmptyListParent,
    findNearestListItemNode,
    getUniqueListItemNodes,
    isNestedListNode
} from "~/utils/listNode";

const DEFAULT_LIST_START_NUMBER = 1;

function $isSelectingEmptyListItem(
    anchorNode: ListItemNode | LexicalNode,
    nodes: Array<LexicalNode>
): boolean {
    return (
        $isListItemNode(anchorNode) &&
        (nodes.length === 0 ||
            (nodes.length === 1 && anchorNode.is(nodes[0]) && anchorNode.getChildrenSize() === 0))
    );
}

function $getListItemValue(listItem: ListItemNode): number {
    const list = listItem.getParent();

    let value = 1;

    if (list !== null) {
        if (!$isListNode(list)) {
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

        if ($isListItemNode(sibling) && !$isListNode(sibling.getFirstChild())) {
            value++;
        }
    }
    return value;
}

export function insertList(editor: LexicalEditor, listType: ListType, styleId?: string): void {
    editor.update(() => {
        const selection = $getSelection();

        if (selection && $isRangeSelection(selection)) {
            const nodes = selection.getNodes();
            const anchor = selection.anchor;
            const anchorNode = anchor.getNode();
            const anchorNodeParent = anchorNode.getParent();

            if ($isSelectingEmptyListItem(anchorNode, nodes)) {
                const list = $createListNode(listType, styleId);

                if ($isRootOrShadowRoot(anchorNodeParent)) {
                    anchorNode.replace(list);
                    const listItem = $createListItemNode();
                    if ($isElementNode(anchorNode)) {
                        listItem.setFormat(anchorNode.getFormatType());
                        listItem.setIndent(anchorNode.getIndent());
                    }
                    list.append(listItem);
                } else if ($isListItemNode(anchorNode)) {
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

                            if ($isListNode(parent)) {
                                if (!handled.has(parentKey)) {
                                    const newListNode = $createListNode(listType, styleId);
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

function createListOrMerge(node: ElementNode, listType: ListType, styleId?: string): ListNode {
    if ($isListNode(node)) {
        return node;
    }

    const previousSibling = node.getPreviousSibling();
    const nextSibling = node.getNextSibling();
    const listItem = $createListItemNode();
    listItem.setFormat(node.getFormatType());
    listItem.setIndent(node.getIndent());
    append(listItem, node.getChildren());

    if ($isListNode(previousSibling) && listType === previousSibling.getListType()) {
        previousSibling.append(listItem);
        node.remove();
        // if the same type of list is on both sides, merge them.

        if ($isListNode(nextSibling) && listType === nextSibling.getListType()) {
            append(previousSibling, nextSibling.getChildren());
            nextSibling.remove();
        }
        return previousSibling;
    } else if ($isListNode(nextSibling) && listType === nextSibling.getListType()) {
        nextSibling.getFirstChildOrThrow().insertBefore(listItem);
        node.remove();
        return nextSibling;
    } else {
        const list = $createListNode(listType, styleId);
        list.append(listItem);
        node.replace(list);
        updateChildrenListItemValue(list);
        return list;
    }
}

/**
 * A recursive function that goes through each list and their children, including nested lists,
 * appending list2 children after list1 children and updating ListItemNode values.
 * @param list1 - The first list to be merged.
 * @param list2 - The second list to be merged.
 */
export function mergeLists(list1: ListNode, list2: ListNode): void {
    const listItem1 = list1.getLastChild();
    const listItem2 = list2.getFirstChild();

    if (listItem1 && listItem2 && isNestedListNode(listItem1) && isNestedListNode(listItem2)) {
        mergeLists(listItem1.getFirstChild(), listItem2.getFirstChild());
        listItem2.remove();
    }

    const toMerge = list2.getChildren();
    if (toMerge.length > 0) {
        list1.append(...toMerge);
        updateChildrenListItemValue(list1);
    }

    list2.remove();
}

export function removeList(editor: LexicalEditor): void {
    editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
            const listNodes = new Set<ListNode>();
            const nodes = selection.getNodes();
            const anchorNode = selection.anchor.getNode();

            if ($isSelectingEmptyListItem(anchorNode, nodes)) {
                listNodes.add($getTopListNode(anchorNode));
            } else {
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];

                    if ($isLeafNode(node)) {
                        const listItemNode = $getNearestNodeOfType(node, ListItemNode);

                        if (listItemNode != null) {
                            listNodes.add($getTopListNode(listItemNode));
                        }
                    }
                }
            }

            for (const listNode of listNodes) {
                let insertionPoint: ListNode | ParagraphNode = listNode;

                const listItems = $getAllListItems(listNode);

                for (const listItemNode of listItems) {
                    const paragraph = $createParagraphNode();

                    append(paragraph, listItemNode.getChildren());

                    insertionPoint.insertAfter(paragraph);
                    insertionPoint = paragraph;

                    // When the anchor and focus fall on the textNode
                    // we don't have to change the selection because the textNode will be appended to
                    // the newly generated paragraph.
                    // When selection is in empty nested list item, selection is actually on the listItemNode.
                    // When the corresponding listItemNode is deleted and replaced by the newly generated paragraph
                    // we should manually set the selection's focus and anchor to the newly generated paragraph.
                    if (listItemNode.__key === selection.anchor.key) {
                        selection.anchor.set(paragraph.getKey(), 0, "element");
                    }
                    if (listItemNode.__key === selection.focus.key) {
                        selection.focus.set(paragraph.getKey(), 0, "element");
                    }

                    listItemNode.remove();
                }
                listNode.remove();
            }
        }
    });
}

export function updateChildrenListItemValue(list: ListNode, children?: Array<LexicalNode>): void {
    const childrenOrExisting = children || list.getChildren();
    if (childrenOrExisting !== undefined) {
        for (let i = 0; i < childrenOrExisting.length; i++) {
            const child = childrenOrExisting[i];
            if ($isListItemNode(child)) {
                const prevValue = child.getValue();
                const nextValue = $getListItemValue(child);

                if (prevValue !== nextValue) {
                    child.setValue(nextValue);
                }
            }
        }
    }
}

export function $handleIndent(WebinyListItemNodes: Array<ListItemNode>): void {
    // go through each node and decide where to move it.
    const removed = new Set<NodeKey>();

    WebinyListItemNodes.forEach((WebinyListItemNode: ListItemNode) => {
        if (isNestedListNode(WebinyListItemNode) || removed.has(WebinyListItemNode.getKey())) {
            return;
        }

        const parent = WebinyListItemNode.getParent();

        // We can cast both of the below `isNestedListNode` only returns a boolean type instead of a user-defined type guards
        const nextSibling = WebinyListItemNode.getNextSibling<ListItemNode>() as ListItemNode;
        const previousSibling =
            WebinyListItemNode.getPreviousSibling<ListItemNode>() as ListItemNode;
        // if there are nested lists on either side, merge them all together.

        if (isNestedListNode(nextSibling) && isNestedListNode(previousSibling)) {
            const innerList = previousSibling.getFirstChild();

            if ($isListNode(innerList)) {
                innerList.append(WebinyListItemNode);
                const nextInnerList = nextSibling.getFirstChild();

                if ($isListNode(nextInnerList)) {
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

            if ($isListNode(innerList)) {
                const firstChild = innerList.getFirstChild();

                if (firstChild !== null) {
                    firstChild.insertBefore(WebinyListItemNode);
                }
                updateChildrenListItemValue(innerList);
            }
        } else if (isNestedListNode(previousSibling)) {
            const innerList = previousSibling.getFirstChild();

            if ($isListNode(innerList)) {
                innerList.append(WebinyListItemNode);
                updateChildrenListItemValue(innerList);
            }
        } else {
            // otherwise, we need to create a new nested ListNode

            if ($isListNode(parent)) {
                const newListItem = $createListItemNode();
                const newList = $createListNode(parent.getListType(), parent.getStyleId());
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

        if ($isListNode(parent)) {
            updateChildrenListItemValue(parent);
        }
    });
}

export function $handleOutdent(WebinyListItemNodes: Array<ListItemNode>): void {
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
            $isListNode(greatGrandparentList) &&
            $isListItemNode(grandparentListItem) &&
            $isListNode(parentList)
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
                const previousSiblingsListItem = $createListItemNode();
                const previousSiblingsList = $createListNode(listType, themeStyleId);
                previousSiblingsListItem.append(previousSiblingsList);
                WebinyListItemNode.getPreviousSiblings().forEach(sibling =>
                    previousSiblingsList.append(sibling)
                );
                const nextSiblingsListItem = $createListItemNode();
                const nextSiblingsList = $createListNode(listType, themeStyleId);
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
    let webinyListItemNodes: Array<ListItemNode> = [];

    if (selectedNodes.length === 0) {
        selectedNodes.push(selection.anchor.getNode());
    }

    if (selectedNodes.length === 1) {
        // Only 1 node selected. Selection may not contain the ListNodeItem so we traverse the tree to
        // find whether this is part of a WebinyListItemNode
        const nearestWebinyListItemNode = findNearestListItemNode(selectedNodes[0]);

        if (nearestWebinyListItemNode !== null) {
            webinyListItemNodes = [nearestWebinyListItemNode];
        }
    } else {
        webinyListItemNodes = getUniqueListItemNodes(selectedNodes);
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

    if (!$isListItemNode(anchor) || anchor.getTextContent() !== "") {
        return false;
    }
    const topListNode = $getTopListNode(anchor);
    const parent = anchor.getParent();

    if (!$isListNode(parent)) {
        console.log("A WebinyListItemNode must have a WebinyListNode for a parent.");
        return false;
    }

    const grandparent = parent?.getParent() || null;

    let replacementNode;

    if ($isRootOrShadowRoot(grandparent)) {
        replacementNode = $createParagraphNode();
        topListNode.insertAfter(replacementNode);
    } else if ($isListItemNode(grandparent)) {
        replacementNode = $createListItemNode();
        grandparent.insertAfter(replacementNode);
    } else {
        return false;
    }
    replacementNode.select();

    const nextSiblings = anchor.getNextSiblings();

    if (nextSiblings.length > 0) {
        const newList = $createListNode(parent?.getListType(), parent?.getStyleId());

        if ($isParagraphNode(replacementNode)) {
            replacementNode.insertAfter(newList);
        } else {
            const newListItem = $createListItemNode();
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
