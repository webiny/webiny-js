import {
    DOMConversion,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    ElementNode,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread
} from "lexical";
import { EditorTheme, findTypographyStyleByHtmlTag, ThemeEmotionMap } from "@webiny/lexical-theme";
import { addClassNamesToElement, removeClassNamesFromElement } from "@lexical/utils";
import { ListNodeTagType } from "@lexical/list/LexicalListNode";
import { $getListDepth, wrapInListItem } from "~/utils/listNode";
import { $isListItemNode, ListItemNode } from "./ListItemNode";
import { ListType } from "@lexical/list";
import { TypographyStylesNode } from "~/types";

export type SerializedWebinyListNode = Spread<
    {
        styleId?: string;
        className?: string;
        listType: ListType;
        start: number;
        tag: ListNodeTagType;
        type: "wby-list";
    },
    SerializedElementNode
>;

type ListNodeOptions = {
    styleId?: string;
    className?: string;
    start?: number;
    key?: NodeKey;
};

export class ListNode extends ElementNode implements TypographyStylesNode {
    /** @internal */
    __tag: ListNodeTagType;
    /** @internal */
    __start: number;
    /** @internal */
    __listType: ListType;

    private __styleId: string;
    private __className: string | undefined;

    constructor(listType: ListType, options: ListNodeOptions = {}) {
        const { styleId, key, className, start } = options;
        super(key);
        this.__styleId = styleId ?? "";
        this.__className = className;
        const _listType = TAG_TO_WEBINY_LIST_TYPE[listType] || listType;
        this.__listType = _listType;
        this.__tag = _listType === "number" ? "ol" : "ul";
        this.__start = start || 1;
    }

    static override getType() {
        return "wby-list";
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const tag = this.__tag;
        const element = document.createElement(tag);

        if (this.__start !== 1) {
            element.setAttribute("start", String(this.__start));
        }

        this.updateElementWithThemeClasses(element, config.theme as EditorTheme);

        // @ts-expect-error Internal field.
        element.__lexicalListType = this.__listType;
        const theme = config.theme as EditorTheme;
        setListThemeClassNames(element, theme, this, this.__styleId);
        return element;
    }

    override exportDOM(editor: LexicalEditor): DOMExportOutput {
        const base = super.exportDOM(editor);

        const element = base.element as HTMLElement;
        if (element && this.__className) {
            element.classList.add(this.__className);
        }

        return { ...base, element };
    }

    static override clone(node: ListNode): ListNode {
        return new ListNode(node.getListType(), {
            className: node.getClassName(),
            styleId: node.getStyleId(),
            start: node.getStart(),
            key: node.getKey()
        });
    }

    getStyleId(): string | undefined {
        return this.__styleId;
    }

    setStyleId(styleId: string | undefined) {
        this.__styleId = styleId ?? "";
    }

    setClassName(className: string | undefined) {
        this.__className = className;
    }

    getClassName(): string | undefined {
        return this.__className;
    }

    static override importJSON(serializedNode: SerializedWebinyListNode): ListNode {
        const node = $createListNode(
            serializedNode.listType,
            // `styleId` is for backwards compatibility
            serializedNode.styleId ?? serializedNode.styleId,
            serializedNode.start
        );
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);

        node.setClassName(serializedNode.className);

        return node;
    }

    override exportJSON(): SerializedWebinyListNode {
        return {
            ...super.exportJSON(),
            styleId: this.__styleId,
            className: this.__className,
            listType: this.getListType(),
            start: this.getStart(),
            tag: this.getTag(),
            type: "wby-list"
        };
    }

    static importDomConversionMap(): DOMConversion<HTMLElement> | null {
        return {
            conversion: convertListNode,
            priority: 0
        };
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            ol: () => {
                return this.importDomConversionMap();
            },
            ul: () => {
                return this.importDomConversionMap();
            }
        };
    }

    override updateDOM(prevNode: ListNode, dom: HTMLElement, config: EditorConfig): boolean {
        if (prevNode.__tag !== this.__tag) {
            return true;
        }

        setListThemeClassNames(dom, config.theme as EditorTheme, this, this.__styleId);
        return false;
    }

    override extractWithChild(child: LexicalNode): boolean {
        return $isListItemNode(child);
    }

    public getListType(): ListType {
        return this.__listType;
    }

    public getStart(): number {
        return this.__start;
    }

    private getTag(): ListNodeTagType {
        return this.__tag;
    }

    protected updateElementWithThemeClasses(element: HTMLElement, theme: EditorTheme): HTMLElement {
        if (!theme?.emotionMap) {
            return element;
        }

        if (!this.__styleId || !this.__className) {
            this.setDefaultTypography(theme.emotionMap);
        }

        if (this.__className) {
            addClassNamesToElement(element, this.__className);
        }

        return element;
    }

    private setDefaultTypography(themeEmotionMap: ThemeEmotionMap) {
        const typographyStyle = findTypographyStyleByHtmlTag(this.getTag(), themeEmotionMap);
        if (typographyStyle) {
            this.__styleId = typographyStyle.id;
            this.__className = typographyStyle.className;
        }
    }
}

function setListThemeClassNames(
    dom: HTMLElement,
    editorTheme: EditorTheme,
    node: ListNode,
    styleId: string
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
        const listClassName = `${listTheme[node.__tag]} ${emotionMap[styleId]?.className ?? ""}`;
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

function convertListNode(domNode: Node): DOMConversionOutput {
    const nodeName = domNode.nodeName.toLowerCase();
    let node = null;

    if (nodeName === "ol") {
        node = $createListNode("number");
    } else if (nodeName === "ul") {
        node = $createListNode("bullet");
    }

    return {
        // @ts-expect-error
        after: normalizeChildren,
        node
    };
}

const TAG_TO_WEBINY_LIST_TYPE: Record<string, ListType> = {
    ol: "number",
    ul: "bullet"
};

export function $createListNode(listType: ListType, styleId?: string, start = 1): ListNode {
    return new ListNode(listType, {
        start,
        styleId
    });
}

export function $isListNode(node: LexicalNode | null | undefined): node is ListNode {
    return node instanceof ListNode;
}
