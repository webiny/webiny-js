import {
    DOMConversion,
    DOMConversionMap,
    DOMConversionOutput,
    EditorConfig,
    ElementNode,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread
} from "lexical";
import { WebinyEditorTheme, WebinyTheme } from "~/themes/webinyLexicalTheme";
import { addClassNamesToElement, removeClassNamesFromElement } from "@lexical/utils";
import { ListNodeTagType } from "@lexical/list/LexicalListNode";
import { $getListDepth, wrapInListItem } from "~/utils/nodes/listNode";
import { ListType } from "@lexical/list";
import { $isListItemNode, ListItemNode } from "~/nodes/ListItemNode";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";

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

export class ListNode extends ElementNode {
    /** @internal */
    __tag: ListNodeTagType;
    /** @internal */
    __start: number;
    /** @internal */
    __listType: ListType;

    __themeStyleId: string;

    constructor(listType: ListType, themeStyleId?: string, start?: number, key?: NodeKey) {
        super(key);
        this.__themeStyleId = themeStyleId || "";
        const _listType = TAG_TO_WEBINY_LIST_TYPE[listType] || listType;
        this.__listType = _listType;
        this.__tag = _listType === "number" ? "ol" : "ul";
        this.__start = start || 1;
    }

    static override getType() {
        return "webiny-list";
    }

    isStyleExistInTheme(theme: WebinyTheme): boolean {
        return theme?.emotionMap ? !!theme?.emotionMap[this.__themeStyleId] : false;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const tag = this.__tag;
        const dom = document.createElement(tag);
        const wTheme = config.theme as WebinyTheme;

        if (this.__start !== 1) {
            dom.setAttribute("start", String(this.__start));
        }

        // If styleId is not set or user removed from theme, set default style
        if (!this.hasThemeStyle() || !this.isStyleExistInTheme(wTheme)) {
            this.setDefaultThemeListStyleByTag(this.__tag, wTheme);
        }

        // @ts-expect-error Internal field.
        dom.__lexicalListType = this.__listType;
        const theme = config.theme as WebinyEditorTheme;
        setListThemeClassNames(dom, theme, this, this.__themeStyleId);
        dom.setAttribute(TypographyStyleAttrName, this.__themeStyleId);
        return dom;
    }

    static override clone(node: ListNode): ListNode {
        return new ListNode(node.getListType(), node.getStyleId(), node.getStart(), node.__key);
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

    static override importJSON(serializedNode: SerializedWebinyListNode): ListNode {
        const node = $createListNode(
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

    static importDomConversionMap(): DOMConversion<HTMLElement> | null {
        return {
            conversion: convertWebinyListNode,
            priority: 0
        };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            ol: () => {
                return this.importDomConversionMap();
            },
            ul: () => {
                return this.importDomConversionMap();
            }
        };
    }

    /*
     * Set default styleId from first style that is found in the theme that contains current ul or ol tag
     */
    setDefaultThemeListStyleByTag(tag: string, theme: WebinyTheme) {
        if (!tag) {
            return;
        }

        const themeEmotionMap = theme?.emotionMap;
        if (!themeEmotionMap) {
            return;
        }

        const style = findTypographyStyleByHtmlTag(tag, themeEmotionMap);

        if (style) {
            this.__themeStyleId = style.id;
        }
    }

    hasThemeStyle(): boolean {
        return !!this.__themeStyleId;
    }

    override updateDOM(prevNode: ListNode, dom: HTMLElement, config: EditorConfig): boolean {
        const wTheme = config.theme as WebinyTheme;

        if (prevNode.__tag !== this.__tag) {
            return true;
        }

        // if styleId is not set or user removed from theme, set default style.
        if (!this.hasThemeStyle() || !this.isStyleExistInTheme(wTheme)) {
            this.setDefaultThemeListStyleByTag(this.__tag, wTheme);
        }

        setListThemeClassNames(dom, config.theme, this, this.__themeStyleId);
        dom.setAttribute(TypographyStyleAttrName, this.__themeStyleId);
        return false;
    }

    override extractWithChild(child: LexicalNode): boolean {
        return $isListItemNode(child);
    }
}

function setListThemeClassNames(
    dom: HTMLElement,
    editorTheme: WebinyEditorTheme,
    node: ListNode,
    themeStyleId: string
): void {
    const editorThemeClasses = editorTheme;
    const classesToAdd = [];
    const classesToRemove = [];
    const listTheme = editorThemeClasses.list;
    const emotionMap = editorTheme?.emotionMap || {};
    if (listTheme !== undefined) {
        const listLevelsClassNames = listTheme[`${node.__tag}Depth`] || [];
        const listDepth = $getListDepth(node) - 1;
        const normalizedListDepth = listDepth % listLevelsClassNames.length;
        const listLevelClassName = listLevelsClassNames[normalizedListDepth];
        const listClassName = `${listTheme[node.__tag]} ${
            emotionMap[themeStyleId]?.className ?? ""
        }`;
        let nestedListClassName;
        const nestedListTheme = listTheme.nested;

        if (nestedListTheme !== undefined && nestedListTheme.list) {
            nestedListClassName = nestedListTheme.list;
        }

        if (listClassName) {
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
function normalizeChildren(nodes: Array<ListNode>): Array<ListItemNode> {
    const normalizedListItems: Array<ListItemNode> = [];
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if ($isListItemNode(node)) {
            normalizedListItems.push(node);
            node.getChildren().forEach(child => {
                if ($isListNode(child)) {
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
        node = $createListNode("number");
    } else if (nodeName === "ul") {
        node = $createListNode("bullet");
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

export function $createListNode(listType: ListType, themeStyleId?: string, start = 1): ListNode {
    return new ListNode(listType, themeStyleId, start);
}

export function $isListNode(node: LexicalNode | null | undefined): node is ListNode {
    return node instanceof ListNode;
}
