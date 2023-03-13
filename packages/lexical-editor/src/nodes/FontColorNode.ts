import {
    createCommand,
    EditorConfig,
    LexicalCommand,
    LexicalEditor,
    NodeKey,
    SerializedTextNode,
    Spread,
    TextNode
} from "lexical";
import { WebinyLexicalTheme } from "~/themes/webinyLexicalTheme";

export const ADD_FONT_COLOR_COMMAND: LexicalCommand<FontColorPayload> =
    createCommand("ADD_FONT_COLOR_COMMAND");
const FontColorNodeAttrName = "font-color-theme";

export interface FontColorPayload {
    color: string;
    isThemeColor: boolean;
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

// export const createFontColorNodeClass = (themeStyles: ThemeStyles) => {

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
        const nodeCLone = new FontColorNode(
            node.__text,
            node.__color,
            node.__themeColor,
            node.__key
        );
        return nodeCLone;
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

    addColorValueToHTMLElement(element: HTMLElement, theme: WebinyLexicalTheme): HTMLElement {
        const hasThemeColor = this.__themeColor !== "custom";
        // get the updated color from webiny theme
        if (hasThemeColor && theme?.styles?.colors) {
            this.__color = theme.styles.colors[this.__themeColor];
        }

        element.setAttribute(FontColorNodeAttrName, this.__themeColor);
        element.style.color = this.__color;
        debugger;
        return element;
    }

    override updateDOM(prevNode: FontColorNode, dom: HTMLElement, config: EditorConfig): boolean {
        debugger;
        const isUpdated = super.updateDOM(prevNode, dom, config);
        this.addColorValueToHTMLElement(dom, config.theme);
        return isUpdated;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        debugger;
        const element = super.createDOM(config);
        return this.addColorValueToHTMLElement(element, config.theme);
    }
}

export const $createFontColorNode = (text: string, color: string, key?: NodeKey): TextNode => {
    return new FontColorNode(text, color, key);
};
