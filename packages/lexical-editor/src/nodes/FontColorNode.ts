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

/*function convertFontColorElement(domNode: HTMLElement): DOMConversionOutput | null {
    const textContent = domNode.textContent;
    //TODO: apply theme
    const themeColor = domNode.attributes.getNamedItem(FontColorNodeAttribute)?.value || "#000";
    const color = domNode.style.color || "#000";
    if (textContent !== null) {
        const node = $createFontColorNode(textContent);
        return {
            node
        };
    }

    return null;
}*/

// export const createFontColorNodeClass = (themeStyles: ThemeStyles) => {

/**
 * Main responsibility of this node is to apply custom or Webiny theme color to selected text.
 * Extends the original TextNode node to add additional transformation and support for webiny theme font color.
 */
export class FontColorTextNode extends TextNode {
    __themeStyles: ThemeStyles;
    __themeColor: string;

    /**
     * @description Webiny theme color property name. Example: color1, color2...
     * If not specified, specified color will be applied or will remain undefined.
     */
    /**
     * @description Color to be applied on text.
     * If theme color is specified that as priority will be applied to this variable or #000 will be set.
     */
    __color: string;

    constructor(text: string, color: string, themeStyles: ThemeStyles, key?: NodeKey) {
        super(text, key);
        this.__themeStyles = themeStyles;
        this.__themeColor = this.getThemeColorName(color);
        this.__color = this.getColorValue(color);
    }

    static override getType(): string {
        return "font-color-node";
    }

    static override clone(node: FontColorTextNode): FontColorTextNode {
        return new FontColorTextNode(node.__text, node.__color, node.__themeStyles, node.__key);
    }

    importJSON(serializedNode: SerializedFontColorNode): TextNode {
        const node = $createFontColorNode(
            serializedNode.text,
            serializedNode.color,
            this.__themeColors
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

    getThemeColorName(color: string) {
        return this.isColorThemeStyleName(color) ? color : "custom";
    }

    getColorValue(color: string) {
        return this.isColorThemeStyleName(color) ? this.__themeStyles?.colors[color] : color;
    }

    isColorThemeStyleName(color: string) {
        return !!this.__themeStyles?.colors[color];
    }

    addColorValueToHTMLElement(element: HTMLElement): HTMLElement {
        if (!element) {
            return element;
        }
        element.setAttribute(FontColorNodeAttrName, this.__themeColor);
        element.style.color = this.__color;
        return element;
    }

    override updateDOM(
        prevNode: FontColorTextNode,
        dom: HTMLElement,
        config: EditorConfig
    ): boolean {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        this.addColorValueToHTMLElement(dom);
        return isUpdated;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.addColorValueToHTMLElement(element);
    }

    override canInsertTextBefore(): boolean {
        return false;
    }

    override canInsertTextAfter(): boolean {
        return false;
    }

    override isTextEntity(): true {
        return true;
    }
}

export const $createFontColorNode = (
    text: string,
    color: string,
    themeColors: ThemeStyles,
    key?: NodeKey
): TextNode => {
    return new FontColorTextNode(text, color, themeColors);
    /*  const fontColor = new FontColorActionNode(text, color);
    return fontColor;*/
};
