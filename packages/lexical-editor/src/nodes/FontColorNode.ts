import {
    createCommand,
    DOMConversionMap,
    DOMConversionOutput,
    EditorConfig,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedTextNode,
    Spread,
    TextNode
} from "lexical";

export const ADD_FONT_COLOR_COMMAND: LexicalCommand<FontColorPayload> =
    createCommand("ADD_FONT_COLOR_COMMAND");
export const FontColorNodeType = "font-color-node";
const FontColorNodeAttribute = "font-color-theme";

export interface FontColorPayload {
    themeColor: string;
    color?: string;
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

function convertFontColorElement(domNode: HTMLElement): DOMConversionOutput | null {
    const textContent = domNode.textContent;
    //TODO: apply theme
    const themeColor = domNode.attributes.getNamedItem(FontColorNodeAttribute)?.value || "#000";
    const color = domNode.style.color || "#000";
    if (textContent !== null) {
        const node = $createFontColorNode(textContent, color, themeColor);
        return {
            node
        };
    }

    return null;
}

/**
 * Main responsibility of this node is to apply custom or Webiny theme color to selected text.
 * Extends the original TextNode node to add additional transformation and support for webiny theme font color.
 */
export class FontColorTextNode extends TextNode {
    /**
     * @description Webiny theme color property name. Example: color1, color2...
     * If not specified, specified color will be applied or will remain undefined.
     */
    __themeColor: string;

    /**
     * @description Color to be applied on text.
     * If theme color is specified that as priority will be applied to this variable or #000 will be set.
     */
    __color: string;

    constructor(text: string, color: string, themeColor: string, key?: NodeKey) {
        super(text, key);
        this.__themeColor = themeColor;
        this.__color = color;
    }

    static override getType(): string {
        return FontColorNodeType;
    }

    static override clone(node: FontColorTextNode): FontColorTextNode {
        return new FontColorTextNode(node.__text, node.__themeColor, node.__key);
    }

    static override importJSON(serializedNode: SerializedFontColorNode): FontColorTextNode {
        const node = $createFontColorNode(
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

    override updateDOM(
        prevNode: FontColorTextNode,
        dom: HTMLElement,
        config: EditorConfig
    ): boolean {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        dom.setAttribute("theme-font-color", this.__themeColor);
        dom.style.color = this.__color;
        return isUpdated;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        element.setAttribute("theme-font-color", this.__themeColor);
        element.style.color = this.__color;
        return element;
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

export function $createFontColorNode(
    text: string,
    color: string,
    themeColor: string,
    key?: NodeKey
): FontColorTextNode {
    return new FontColorTextNode(text, color, themeColor, key);
}

export function $isFontColorTextNode(node: LexicalNode | null | undefined | undefined): boolean {
    return node instanceof FontColorTextNode;
}
