import {
    createCommand,
    EditorConfig,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    RangeSelection,
    SerializedTextNode,
    Spread,
    TextNode
} from "lexical";
import { WebinyEditorTheme } from "~/themes/webinyLexicalTheme";
import { TypographyValue } from "~/context/TypographyActionContext";
import { styleObjectToString } from "~/utils/styleObjectToString";

export const ADD_TYPOGRAPHY_COMMAND: LexicalCommand<TypographyPayload> =
    createCommand("ADD_TYPOGRAPHY_COMMAND");
const TypographyNodeAttrName = "typography-theme";

export interface TypographyPayload {
    value: TypographyValue;
    caption?: LexicalEditor;
    key?: NodeKey;
}

type ThemeTypographyName = "normal" | string;

export type SerializedTypographyNode = Spread<
    {
        themeTypographyName: ThemeTypographyName;
        typographyStyles: Record<string, any>;
        type: "typography-node";
        version: 1;
    },
    SerializedTextNode
>;

/**
 * Main responsibility of this node is to apply custom or Webiny theme typography to selected text.
 * Extends the original TextNode node to add additional transformation and support for webiny theme typography.
 */
export class TypographyNode extends TextNode {
    __themeTypographyName: ThemeTypographyName;
    __typographyStyles: Record<string, any>;

    constructor(
        text: string,
        typographyStyles: Record<string, any>,
        themeTypographyName?: ThemeTypographyName,
        key?: NodeKey
    ) {
        super(text, key);
        this.__themeTypographyName = themeTypographyName || "default";
        this.__typographyStyles = typographyStyles;
    }

    static override getType(): string {
        return "typography-node";
    }

    static override clone(node: TypographyNode): TypographyNode {
        return new TypographyNode(node.__text, node.__color, node.__themeColor, node.__key);
    }

    static override importJSON(serializedNode: SerializedTypographyNode): TextNode {
        const node = new TypographyNode(
            serializedNode.text,
            serializedNode.typographyStyles,
            serializedNode.themeTypographyName
        );
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    override exportJSON(): SerializedTypographyNode {
        return {
            ...super.exportJSON(),
            themeTypographyName: this.__themeTypographyName,
            typographyStyles: this.__typographyStyles,
            type: "typography-node",
            version: 1
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

    override updateDOM(prevNode: TypographyNode, dom: HTMLElement, config: EditorConfig): boolean {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        dom = this.addStylesHTMLElement(dom, config.theme);
        return isUpdated;
    }

    getTypographyValue(): { themeTypographyName: string; styleObject: Record<string, any> } {
        return {
            themeTypographyName: this.__themeTypographyName,
            styleObject: this.__typographyStyles
        };
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.addStylesHTMLElement(element, config.theme);
    }
}

export const $createTypographyNode = (
    text: string,
    typographyStyles: Record<string, any>,
    themeTypographyName?: ThemeTypographyName,
    key?: NodeKey
): TypographyNode => {
    return new TypographyNode(text, typographyStyles, themeTypographyName, key);
};

export const $isTypographyNode = (node: LexicalNode): boolean => {
    return node instanceof TypographyNode;
};

export function $applyStylesToNode(node: TypographyNode, nodeStyleProvider: RangeSelection) {
    node.setFormat(nodeStyleProvider.format);
    node.setStyle(nodeStyleProvider.style);
}
