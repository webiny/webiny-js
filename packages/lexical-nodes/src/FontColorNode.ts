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
import { EditorTheme } from "@webiny/lexical-theme";

export const ADD_FONT_COLOR_COMMAND: LexicalCommand<FontColorPayload> =
    createCommand("ADD_FONT_COLOR_COMMAND");
const FontColorNodeAttrName = "data-theme-font-color-name";

export interface FontColorPayload {
    // This color can be hex string
    color: string;
    // webiny theme color variable like color1, color2...
    themeColorName: string | undefined;
    caption?: LexicalEditor;
    key?: NodeKey;
}

type ThemeStyleColorName = string;
type ThemeColor = "custom" | ThemeStyleColorName;

export type SerializedFontColorNode = Spread<
    {
        themeColor: ThemeColor;
        color: string;
        type: "font-color-node";
        version: 1;
    },
    SerializedTextNode
>;

/**
 * Main responsibility of this node is to apply custom or Webiny theme color to selected text.
 * Extends the original TextNode node to add additional transformation and support for webiny theme font color.
 */
export class FontColorNode extends TextNode {
    __themeColor: ThemeColor;
    __color: string;

    constructor(text: string, color: string, themeColor?: ThemeColor, key?: NodeKey) {
        super(text, key);
        this.__themeColor = themeColor || "custom";
        this.__color = color;
    }

    static override getType(): string {
        return "font-color-node";
    }

    static override clone(node: FontColorNode): FontColorNode {
        return new FontColorNode(node.__text, node.__color, node.__themeColor, node.__key);
    }

    static override importJSON(serializedNode: SerializedFontColorNode): TextNode {
        const node = new FontColorNode(
            serializedNode.text,
            serializedNode.color,
            serializedNode.themeColor
        );
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    override exportJSON(): SerializedFontColorNode {
        return {
            ...super.exportJSON(),
            themeColor: this.__themeColor,
            color: this.__color,
            type: "font-color-node",
            version: 1
        };
    }

    addColorValueToHTMLElement(element: HTMLElement, theme: EditorTheme): HTMLElement {
        const hasThemeColor = this.__themeColor !== "custom";
        // get the updated color from webiny theme
        if (hasThemeColor && theme?.styles?.colors) {
            this.__color = theme.styles.colors[this.__themeColor];
        }

        element.setAttribute(FontColorNodeAttrName, this.__themeColor);
        element.style.color = this.__color;
        return element;
    }

    override updateDOM(prevNode: FontColorNode, dom: HTMLElement, config: EditorConfig): boolean {
        const theme = config.theme;
        const isUpdated = super.updateDOM(prevNode, dom, config);
        const hasThemeColor = this.__themeColor !== "custom";
        // get the updated color from webiny theme
        if (hasThemeColor && theme?.styles?.colors) {
            this.__color = theme.styles.colors[this.__themeColor];
        }

        dom.setAttribute(FontColorNodeAttrName, this.__themeColor);
        dom.style.color = this.__color;
        return isUpdated;
    }

    getColorStyle(): { color: string; themeColor: ThemeColor } {
        return {
            color: this.__color,
            themeColor: this.__themeColor
        };
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.addColorValueToHTMLElement(element, config.theme);
    }
}

export const $createFontColorNode = (
    text: string,
    color: string,
    themeColor?: ThemeColor,
    key?: NodeKey
): FontColorNode => {
    return new FontColorNode(text, color, themeColor, key);
};

export const $isFontColorNode = (node: LexicalNode): node is FontColorNode => {
    return node instanceof FontColorNode;
};

export function $applyStylesToNode(node: FontColorNode, nodeStyleProvider: RangeSelection) {
    node.setFormat(nodeStyleProvider.format);
    node.setStyle(nodeStyleProvider.style);
}
