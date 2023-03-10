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
import { ThemeStyles } from "@webiny/app-page-builder-elements/types";

export const ADD_FONT_COLOR_COMMAND: LexicalCommand<FontColorPayload> =
    createCommand("ADD_FONT_COLOR_COMMAND");
const FontColorNodeAttrName = "font-color-theme";

export interface FontColorPayload {
    color: string;
    caption?: LexicalEditor;
    key?: NodeKey;
}

export type SerializedFontColorNode = Spread<
    {
        themeColor: string;
        color: string;
        type: "font-color-node";
        version: 1;
    },
    SerializedTextNode
>;

export const createFontColorNodeClass = (themeStyles: ThemeStyles) => {
    console.log("CRETE COLOR NODE");

    /**
     * Main responsibility of this node is to apply custom or Webiny theme color to selected text.
     * Extends the original TextNode node to add additional transformation and support for webiny theme font color.
     */
    return class FontColorTextNode extends TextNode {
        __themeStyles: ThemeStyles;
        __themeColor: string;
        __color: string;

        constructor(text: string, color: string, key?: NodeKey) {
            super(text, key);
            this.__themeStyles = themeStyles;
            this.__themeColor = this.getThemeColorName(color);
            this.__color = this.getThemeColorValue(color);
        }

        static override getType(): string {
            return "font-color-node";
        }

        static override clone(node: FontColorTextNode): FontColorTextNode {
            const nodeCLone = new FontColorTextNode(node.__text, node.__color, node.__key);
            return nodeCLone;
        }

        static override importJSON(serializedNode: SerializedFontColorNode): TextNode {
            debugger;
            const color =
                serializedNode.themeColor === "custom"
                    ? serializedNode.color
                    : serializedNode.themeColor;
            const node = new FontColorTextNode(serializedNode.text, color);
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

        getThemeColorName(colorName: string) {
            return this.isThemeColor(colorName) ? colorName : "custom";
        }

        getThemeColorValue(color: string) {
            return this.isThemeColor(color) ? this.__themeStyles?.colors[color] : color;
        }

        isThemeColor(color: string) {
            return !!this.__themeStyles?.colors[color];
        }

        addColorValueToHTMLElement(element: HTMLElement): HTMLElement {
            element.setAttribute(FontColorNodeAttrName, this.__themeColor);
            element.style.color = this.__color;
            debugger;
            return element;
        }

        override updateDOM(
            prevNode: FontColorTextNode,
            dom: HTMLElement,
            config: EditorConfig
        ): boolean {
            debugger;
            const isUpdated = super.updateDOM(prevNode, dom, config);
            this.addColorValueToHTMLElement(dom);
            return isUpdated;
        }

        override createDOM(config: EditorConfig): HTMLElement {
            debugger;
            const element = super.createDOM(config);
            return this.addColorValueToHTMLElement(element);
        }
    };
};

/*export const $createFontColorNode = (
    text: string,
    color: string,
    themeColors: ThemeStyles,
    key?: NodeKey
): TextNode => {
    return new FontColorTextNode(text, color, themeColors);
    /!*  const fontColor = new FontColorActionNode(text, color);
    return fontColor;*!/
};*/
