import {
    $createParagraphNode,
    createCommand,
    DOMConversionOutput,
    EditorConfig,
    ElementNode,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    RangeSelection,
    SerializedElementNode,
    Spread
} from "lexical";
import { WebinyEditorTheme } from "~/themes/webinyLexicalTheme";
import { styleObjectToString } from "~/utils/styleObjectToString";
import { TypographyHTMLTag, TypographyValue } from "~/types";
import { $createHeadingNode } from "@lexical/rich-text";

// Command and payload
export const ADD_TYPOGRAPHY_ELEMENT_COMMAND: LexicalCommand<TypographyPayload> = createCommand(
    "ADD_TYPOGRAPHY_ELEMENT_COMMAND"
);
const TypographyNodeAttrName = "typography-el-theme";

export interface TypographyPayload {
    value: TypographyValue;
    caption?: LexicalEditor;
    key?: NodeKey;
}

// Node
type ThemeTypographyName = "normal" | string;
export type SerializedTypographyNode = Spread<
    {
        tag: TypographyHTMLTag;
        themeTypographyName: ThemeTypographyName;
        typographyStyles: Record<string, any>;
        type: "typography-el-node";
        version: 1;
    },
    SerializedElementNode
>;

function convertElement(domNode: Node): DOMConversionOutput {
    const nodeName = domNode.nodeName.toLowerCase();
    let node = null;
    if (
        nodeName === "h1" ||
        nodeName === "h2" ||
        nodeName === "h3" ||
        nodeName === "h4" ||
        nodeName === "h5" ||
        nodeName === "h6"
    ) {
        node = $createHeadingNode(nodeName);
    }

    if (nodeName === "p") {
        node = $createParagraphNode();
    }
    return { node };
}

/**
 * Main responsibility of this node is to apply custom or Webiny theme typography to selected text.
 * Extends the original ElementNode node to add additional transformation and support for webiny theme typography.
 */
export class TypographyElementNode extends ElementNode {
    __tag: TypographyHTMLTag;
    __themeTypographyName: ThemeTypographyName;
    __typographyStyles: Record<string, any>;

    constructor(
        tag: TypographyHTMLTag,
        typographyStyles: Record<string, any>,
        themeTypographyName?: ThemeTypographyName,
        key?: NodeKey
    ) {
        super(key);
        this.__tag = tag;
        this.__themeTypographyName = themeTypographyName || "default";
        this.__typographyStyles = typographyStyles;
    }

    static override getType(): string {
        return "typography-el-node";
    }

    static override clone(node: TypographyElementNode): TypographyElementNode {
        return new TypographyElementNode(
            node.__tag,
            node.__typographyStyles,
            node.__themeTypographyName,
            node.__key
        );
    }

    getTypographyValue(): TypographyValue {
        return {
            htmlTag: this.__tag,
            styleObject: this.__typographyStyles,
            themeTypographyName: this.__themeTypographyName
        };
    }

    addStylesHTMLElement(element: HTMLElement, theme: WebinyEditorTheme): HTMLElement {
        // if theme is available get the latest typography value
        if (theme?.styles?.typography) {
            this.__typographyStyles = theme.styles.typography[this.__themeTypographyName];
        }

        element.setAttribute(TypographyNodeAttrName, this.__themeTypographyName);
        element.style.cssText = styleObjectToString(this.__typographyStyles);
        return element;
    }

    override exportJSON(): SerializedTypographyNode {
        return {
            ...super.exportJSON(),
            tag: this.__tag,
            themeTypographyName: this.__themeTypographyName,
            typographyStyles: this.__typographyStyles,
            type: "typography-el-node",
            version: 1
        };
    }

    static override importJSON(serializedNode: SerializedTypographyNode): TypographyElementNode {
        const node = new TypographyElementNode(
            serializedNode.tag,
            serializedNode.typographyStyles,
            serializedNode.themeTypographyName
        );
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const tag = this.__tag;
        const element = document.createElement(tag);
        return this.addStylesHTMLElement(element, config.theme);
    }

    override updateDOM(_prevNode: unknown, _dom: HTMLElement, _config: EditorConfig): boolean {
        return false;
    }
}

export const $createTypographyNode = (
    value: TypographyValue,
    key?: NodeKey
): TypographyElementNode => {
    return new TypographyElementNode(
        value.htmlTag,
        value.styleObject,
        value.themeTypographyName,
        key
    );
};

export const $isTypographyElementNode = (node: ElementNode | LexicalNode | null): boolean => {
    return node instanceof TypographyElementNode;
};
