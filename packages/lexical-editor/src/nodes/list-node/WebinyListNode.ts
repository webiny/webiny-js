import {
    DOMConversion,
    DOMConversionMap,
    DOMConversionOutput,
    EditorConfig,
    EditorThemeClasses,
    ElementNode,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread
} from "lexical";
import { WebinyEditorTheme } from "~/themes/webinyLexicalTheme";
import { findTypographyStyleById } from "~/utils/typography";
import { styleObjectToString } from "~/utils/styleObjectToString";
import { addClassNamesToElement, removeClassNamesFromElement } from "@lexical/utils";
import { ListNodeTagType } from "@lexical/list/LexicalListNode";

import { $getListDepth, wrapInListItem } from "~/utils/nodes/list-node";
import { ListType } from "@lexical/list";
import { $isWebinyListItemNode, WebinyListItemNode } from "~/nodes/list-node/WebinyListItemNode";

const TypographyStyleAttrName = "data-theme-list-style-id";

export type SerializedWebinyListNode = Spread<
    {
        themeStyleId: string;
        listType: ListType;
        start: number;
        tag: ListNodeTagType;
        type: "webiny-list";
        version: 1;
    },
    SerializedElementNode
>;

export class WebinyListNode extends ElementNode {
    /** @internal */
    __tag: ListNodeTagType;
    /** @internal */
    __start: number;
    /** @internal */
    __listType: ListType;

    __themeStyleId: string;

    constructor(listType: ListType, themeStyleId: string, start: number, key?: NodeKey) {
        super(key);
        this.__themeStyleId = themeStyleId;
        const _listType = TAG_TO_WEBINY_LIST_TYPE[listType] || listType;
        this.__listType = _listType;
        this.__tag = _listType === "number" ? "ol" : "ul";
        this.__start = start;
    }

    static override getType() {
        return "webiny-list";
    }

    addStylesHTMLElement(element: HTMLElement, theme: WebinyEditorTheme): HTMLElement {
        let css = {};
        if (this.__themeStyleId) {
            const typographyStyleValue = findTypographyStyleById(theme, this.__themeStyleId);
            css = typographyStyleValue?.css ? typographyStyleValue.css : {};
            element.setAttribute(TypographyStyleAttrName, this.__themeStyleId);
        }
        element.style.cssText = styleObjectToString(css);
        return element;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const tag = this.__tag;
        const dom = document.createElement(tag);

        if (this.__start !== 1) {
            dom.setAttribute("start", String(this.__start));
        }

        // @ts-expect-error Internal field.
        dom.__lexicalListType = this.__listType;
        setListThemeClassNames(dom, config.theme, this);
        this.addStylesHTMLElement(dom, config.theme);

        return dom;
    }

    static override clone(node: WebinyListNode): WebinyListNode {
        return new WebinyListNode(
            node.getListType(),
            node.getStyleId(),
            node.getStart(),
            node.__key
        );
    }

    getTag(): ListNodeTagType {
        return this.__tag;
    }

    getListType(): ListType {
        return this.__listType;
    }

    getStart(): number {
        return this.__start;
    }

    getStyleId(): string {
        return this.__themeStyleId;
    }

    static override importJSON(serializedNode: SerializedWebinyListNode): WebinyListNode {
        const node = $createWebinyListNode(
            serializedNode.listType,
            serializedNode.themeStyleId,
            serializedNode.start
        );
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    // @ts-ignore
    override exportJSON(): SerializedWebinyListNode {
        return {
            ...super.exportJSON(),
            themeStyleId: this.__themeStyleId ?? "",
            listType: this.getListType(),
            start: this.getStart(),
            tag: this.getTag(),
            type: "webiny-list",
            version: 1
        };
    }

    static importDomConversionMap(domNode: HTMLElement): DOMConversion<HTMLElement> | null {
        return {
            conversion: convertWebinyListNode,
            priority: 0
        }
    }

    static importDOM(): DOMConversionMap | null {
        return {
            ol: (domNode: HTMLElement) => {
                return this.importDomConversionMap(domNode);
            },
            ul: (domNode: HTMLElement) => {
                return this.importDomConversionMap(domNode)
            },
        };
    }

    override updateDOM(prevNode: WebinyListNode, dom: HTMLElement, config: EditorConfig): boolean {
        if (prevNode.__tag !== this.__tag) {
            return true;
        }
        // update styles for different tag styles
        setListThemeClassNames(dom, config.theme, this);
        this.addStylesHTMLElement(dom, config.theme);
        return false;
    }
}

function setListThemeClassNames(
    dom: HTMLElement,
    editorThemeClasses: EditorThemeClasses,
    node: WebinyListNode
): void {
    const classesToAdd = [];
    const classesToRemove = [];
    const listTheme = editorThemeClasses.list;

    if (listTheme !== undefined) {
        const listLevelsClassNames = listTheme[`${node.__tag}Depth`] || [];
        const listDepth = $getListDepth(node) - 1;
        const normalizedListDepth = listDepth % listLevelsClassNames.length;
        const listLevelClassName = listLevelsClassNames[normalizedListDepth];
        const listClassName = listTheme[node.__tag];
        let nestedListClassName;
        const nestedListTheme = listTheme.nested;

        if (nestedListTheme !== undefined && nestedListTheme.list) {
            nestedListClassName = nestedListTheme.list;
        }

        if (listClassName !== undefined) {
            classesToAdd.push(listClassName);
        }

        if (listLevelClassName !== undefined) {
            const listItemClasses = listLevelClassName.split(" ");
            classesToAdd.push(...listItemClasses);
            for (let i = 0; i < listLevelsClassNames.length; i++) {
                if (i !== normalizedListDepth) {
                    classesToRemove.push(node.__tag + i);
                }
            }
        }

        if (nestedListClassName !== undefined) {
            const nestedListItemClasses = nestedListClassName.split(" ");

            if (listDepth > 1) {
                classesToAdd.push(...nestedListItemClasses);
            } else {
                classesToRemove.push(...nestedListItemClasses);
            }
        }
    }

    if (classesToRemove.length > 0) {
        removeClassNamesFromElement(dom, ...classesToRemove);
    }

    if (classesToAdd.length > 0) {
        addClassNamesToElement(dom, ...classesToAdd);
    }
}
/*
 * This function normalizes the children of a ListNode after the conversion from HTML,
 * ensuring that they are all ListItemNodes and contain either a single nested ListNode
 * or some other inline content.
 */
function normalizeChildren(nodes: Array<WebinyListNode>): Array<WebinyListItemNode> {
    const normalizedListItems: Array<WebinyListItemNode> = [];
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if ($isWebinyListItemNode(node)) {
            normalizedListItems.push(node);
            node.getChildren().forEach(child => {
                if ($isWebinyListNode(child)) {
                    normalizedListItems.push(wrapInListItem(child));
                }
            });
        } else {
            normalizedListItems.push(wrapInListItem(node));
        }
    }
    return normalizedListItems;
}

function convertWebinyListNode(domNode: Node): DOMConversionOutput {
    const nodeName = domNode.nodeName.toLowerCase();
    let node = null;

    if (nodeName === "ol") {
        node = $createWebinyListNode("number", "");
    } else if (nodeName === "ul") {
        node = $createWebinyListNode("bullet", "");
    }

    return {
        // @ts-ignore
        after: normalizeChildren,
        node
    };
}

const TAG_TO_WEBINY_LIST_TYPE: Record<string, ListType> = {
    ol: "number",
    ul: "bullet"
};

export function $createWebinyListNode(
    listType: ListType,
    themeStyleId: string,
    start = 1
): WebinyListNode {
    return new WebinyListNode(listType, themeStyleId, start);
}

export function $isWebinyListNode(node: LexicalNode | null | undefined): node is WebinyListNode {
    return node instanceof WebinyListNode;
}
