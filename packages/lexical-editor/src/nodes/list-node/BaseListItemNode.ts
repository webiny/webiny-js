import {
    $createParagraphNode,
    $isElementNode,
    $isParagraphNode,
    $isRangeSelection,
    DOMConversionMap,
    DOMConversionOutput,
    EditorConfig,
    EditorThemeClasses,
    ElementNode,
    GridSelection,
    LexicalNode,
    NodeKey,
    NodeSelection,
    ParagraphNode,
    RangeSelection,
    SerializedElementNode
} from "lexical";
import { Spread } from "lexical";
import {
    $createWebinyListNode,
    $isWebinyListNode,
    BaseListNode
} from "~/nodes/list-node/BaseListNode";
import { $createListNode } from "@lexical/list";
import { addClassNamesToElement, removeClassNamesFromElement } from "@lexical/utils";
import {
    $handleIndent,
    $handleOutdent,
    updateChildrenListItemValue
} from "~/nodes/list-node/formatList";

export type SerializedWebinyListItemNode = Spread<
    {
        checked: boolean | undefined;
        type: "webiny-listitem";
        value: number;
        version: 1;
    },
    SerializedElementNode
>;

/** @noInheritDoc */
export class BaseListItemNode extends ElementNode {
    /** @internal */
    __value: number;
    /** @internal */
    __checked?: boolean;

    static override getType(): string {
        return "webiny-listitem";
    }

    static override clone(node: BaseListItemNode): BaseListItemNode {
        return new BaseListItemNode(node.__value, node.__checked, node.__key);
    }

    constructor(value?: number, checked?: boolean, key?: NodeKey) {
        super(key);
        this.__value = value === undefined ? 1 : value;
        this.__checked = checked;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement("li");
        const parent = this.getParent();

        if ($isWebinyListNode(parent)) {
            updateChildrenListItemValue(parent);
            updateListItemChecked(element, this, null, parent);
        }
        element.value = this.__value;
        $setListItemThemeClassNames(element, config.theme, this);

        return element;
    }

    override updateDOM(
        prevNode: BaseListItemNode,
        dom: HTMLElement,
        config: EditorConfig
    ): boolean {
        const parent = this.getParent();

        if ($isWebinyListNode(parent)) {
            updateChildrenListItemValue(parent);
            updateListItemChecked(dom, this, prevNode, parent);
        }
        // @ts-expect-error - this is always HTMLListItemElement
        dom.value = this.__value;

        $setListItemThemeClassNames(dom, config.theme, this);

        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            li: () => ({
                conversion: convertListItemElement,
                priority: 0
            })
        };
    }

    static override importJSON(serializedNode: SerializedWebinyListItemNode): BaseListItemNode {
        const node = new BaseListItemNode(serializedNode.value, serializedNode.checked);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override exportJSON(): SerializedWebinyListItemNode {
        return {
            ...super.exportJSON(),
            checked: this.getChecked(),
            type: "webiny-listitem",
            value: this.getValue(),
            version: 1
        };
    }

    override append(...nodes: LexicalNode[]): this {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if ($isElementNode(node) && this.canMergeWith(node)) {
                const children = node.getChildren();
                this.append(...children);
                node.remove();
            } else {
                super.append(node);
            }
        }

        return this;
    }

    override replace<N extends LexicalNode>(replaceWithNode: N): N {
        if ($isWebinyListItemNode(replaceWithNode)) {
            return super.replace(replaceWithNode);
        }

        const list = this.getParentOrThrow();

        if ($isWebinyListNode(list)) {
            const childrenKeys = list.__children;
            const childrenLength = childrenKeys.length;
            const index = childrenKeys.indexOf(this.__key);

            if (index === 0) {
                list.insertBefore(replaceWithNode);
            } else if (index === childrenLength - 1) {
                list.insertAfter(replaceWithNode);
            } else {
                // Split the list
                const newList = $createWebinyListNode(list.getListType(), list.getStyleId());
                const children = list.getChildren();

                for (let i = index + 1; i < childrenLength; i++) {
                    const child = children[i];
                    newList.append(child);
                }
                list.insertAfter(replaceWithNode);
                replaceWithNode.insertAfter(newList);
            }
            this.remove();

            if (childrenLength === 1) {
                list.remove();
            }
        }

        return replaceWithNode;
    }

    override insertAfter(node: LexicalNode): LexicalNode {
        const listNode = this.getParentOrThrow();

        if (!$isWebinyListNode(listNode)) {
            console.log("insertAfter: webiny list node is not parent of list item node");
            return listNode;
        }

        const siblings = this.getNextSiblings();

        if ($isWebinyListItemNode(node)) {
            const after = super.insertAfter(node);
            const afterListNode = node.getParentOrThrow();

            if ($isWebinyListNode(afterListNode)) {
                afterListNode;
            }

            return after;
        }

        // Attempt to merge if the list is of the same type.

        if ($isWebinyListNode(node) && node.getListType() === listNode.getListType()) {
            let child = node;
            const children = node.getChildren<BaseListNode>();

            for (let i = children.length - 1; i >= 0; i--) {
                child = children[i];

                this.insertAfter(child);
            }

            return child;
        }

        // Otherwise, split the list
        // Split the lists and insert the node in between them
        listNode.insertAfter(node);

        if (siblings.length !== 0) {
            const newListNode = $createListNode(listNode.getListType());

            siblings.forEach(sibling => newListNode.append(sibling));

            node.insertAfter(newListNode);
        }

        return node;
    }

    override remove(preserveEmptyParent?: boolean): void {
        const nextSibling = this.getNextSibling();
        super.remove(preserveEmptyParent);

        if (nextSibling !== null) {
            const parent = nextSibling.getParent();

            if ($isWebinyListNode(parent)) {
                updateChildrenListItemValue(parent);
            }
        }
    }

    override insertNewAfter(): BaseListItemNode | ParagraphNode {
        const newElement = $createWebinyListItemNode(this.__checked == null ? undefined : false);
        this.insertAfter(newElement);

        return newElement;
    }

    override collapseAtStart(selection: RangeSelection): true {
        const paragraph = $createParagraphNode();
        const children = this.getChildren();
        children.forEach(child => paragraph.append(child));
        const listNode = this.getParentOrThrow();
        const listNodeParent = listNode.getParentOrThrow();
        const isIndented = $isWebinyListItemNode(listNodeParent);

        if (listNode.getChildrenSize() === 1) {
            if (isIndented) {
                // if the list node is nested, we just want to remove it,
                // effectively unindenting it.
                listNode.remove();
                listNodeParent.select();
            } else {
                listNode.replace(paragraph);
                // If we have selection on the list item, we'll need to move it
                // to the paragraph
                const anchor = selection.anchor;
                const focus = selection.focus;
                const key = paragraph.getKey();

                if (anchor.type === "element" && anchor.getNode().is(this)) {
                    anchor.set(key, anchor.offset, "element");
                }

                if (focus.type === "element" && focus.getNode().is(this)) {
                    focus.set(key, focus.offset, "element");
                }
            }
        } else {
            listNode.insertBefore(paragraph);
            this.remove();
        }

        return true;
    }

    getValue(): number {
        const self = this.getLatest();

        return self.__value;
    }

    setValue(value: number): void {
        const self = this.getWritable();
        self.__value = value;
    }

    getChecked(): boolean | undefined {
        const self = this.getLatest();

        return self.__checked;
    }

    setChecked(checked?: boolean): void {
        const self = this.getWritable();
        self.__checked = checked;
    }

    toggleChecked(): void {
        this.setChecked(!this.__checked);
    }

    override getIndent(): number {
        // If we don't have a parent, we are likely serializing
        const parent = this.getParent();
        if (parent === null) {
            return this.getLatest().__indent;
        }
        // ListItemNode should always have a ListNode for a parent.
        let listNodeParent = parent.getParentOrThrow();
        let indentLevel = 0;
        while ($isWebinyListItemNode(listNodeParent)) {
            listNodeParent = listNodeParent.getParentOrThrow().getParentOrThrow();
            indentLevel++;
        }

        return indentLevel;
    }

    override setIndent(indent: number): this {
        let currentIndent = this.getIndent();
        while (currentIndent !== indent) {
            if (currentIndent < indent) {
                $handleIndent([this]);
                currentIndent++;
            } else {
                $handleOutdent([this]);
                currentIndent--;
            }
        }

        return this;
    }

    override canIndent(): false {
        // Indent/outdent is handled specifically in the RichText logic.

        return false;
    }

    override insertBefore(nodeToInsert: LexicalNode): LexicalNode {
        if ($isWebinyListItemNode(nodeToInsert)) {
            const parent = this.getParentOrThrow();

            if ($isWebinyListNode(parent)) {
                const siblings = this.getNextSiblings();
                updateChildrenListItemValue(parent, siblings);
            }
        }

        return super.insertBefore(nodeToInsert);
    }

    override canInsertAfter(node: LexicalNode): boolean {
        return $isWebinyListNode(node);
    }

    override canReplaceWith(replacement: LexicalNode): boolean {
        return $isWebinyListItemNode(replacement);
    }

    override canMergeWith(node: LexicalNode): boolean {
        return $isParagraphNode(node) || $isWebinyListItemNode(node);
    }

    override extractWithChild(
        child: LexicalNode,
        selection: RangeSelection | NodeSelection | GridSelection
    ): boolean {
        if (!$isRangeSelection(selection)) {
            return false;
        }

        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();

        return (
            this.isParentOf(anchorNode) &&
            this.isParentOf(focusNode) &&
            this.getTextContent().length === selection.getTextContent().length
        );
    }
}

function $setListItemThemeClassNames(
    dom: HTMLElement,
    editorThemeClasses: EditorThemeClasses,
    node: BaseListItemNode
): void {
    const classesToAdd = [];
    const classesToRemove = [];
    const listTheme = editorThemeClasses.list;
    const listItemClassName = listTheme ? listTheme.listitem : undefined;
    let nestedListItemClassName;

    if (listTheme && listTheme.nested) {
        nestedListItemClassName = listTheme.nested.listitem;
    }

    if (listItemClassName !== undefined) {
        const listItemClasses = listItemClassName.split(" ");
        classesToAdd.push(...listItemClasses);
    }

    if (listTheme) {
        const parentNode = node.getParent();
        const isCheckList = $isWebinyListNode(parentNode) && parentNode?.getListType() === "check";
        const checked = node.getChecked();

        if (!isCheckList || checked) {
            classesToRemove.push(listTheme.listitemUnchecked);
        }

        if (!isCheckList || !checked) {
            classesToRemove.push(listTheme.listitemChecked);
        }

        if (isCheckList) {
            classesToAdd.push(checked ? listTheme.listitemChecked : listTheme.listitemUnchecked);
        }
    }

    if (nestedListItemClassName !== undefined) {
        const nestedListItemClasses = nestedListItemClassName.split(" ");

        if (node.getChildren().some(child => $isWebinyListNode(child))) {
            classesToAdd.push(...nestedListItemClasses);
        } else {
            classesToRemove.push(...nestedListItemClasses);
        }
    }

    if (classesToRemove.length > 0) {
        removeClassNamesFromElement(dom, ...classesToRemove);
    }

    if (classesToAdd.length > 0) {
        addClassNamesToElement(dom, ...classesToAdd);
    }
}

function updateListItemChecked(
    dom: HTMLElement,
    listItemNode: BaseListItemNode,
    prevListItemNode: BaseListItemNode | null,
    listNode: BaseListNode
): void {
    const isCheckList = listNode.getListType() === "check";

    if (isCheckList) {
        // Only add attributes for leaf list items
        if ($isWebinyListNode(listItemNode.getFirstChild())) {
            dom.removeAttribute("role");
            dom.removeAttribute("tabIndex");
            dom.removeAttribute("aria-checked");
        } else {
            dom.setAttribute("role", "checkbox");
            dom.setAttribute("tabIndex", "-1");

            if (!prevListItemNode || listItemNode.__checked !== prevListItemNode.__checked) {
                dom.setAttribute("aria-checked", listItemNode.getChecked() ? "true" : "false");
            }
        }
    } else {
        // Clean up checked state
        if (listItemNode.getChecked() != null) {
            listItemNode.setChecked(undefined);
        }
    }
}

function convertListItemElement(): DOMConversionOutput {
    return { node: $createWebinyListItemNode() };
}

export function $createWebinyListItemNode(checked?: boolean): BaseListItemNode {
    return new BaseListItemNode(undefined, checked);
}

export function $isWebinyListItemNode(
    node: LexicalNode | null | undefined
): node is BaseListItemNode {
    return node instanceof BaseListItemNode;
}
