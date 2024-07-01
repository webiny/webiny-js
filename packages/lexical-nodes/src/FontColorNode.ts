import {
    $getSelection,
    $isRangeSelection,
    createCommand,
    EditorConfig,
    LexicalNode,
    SerializedTextNode,
    Spread,
    TextNode
} from "lexical";
import { EditorTheme } from "@webiny/lexical-theme";

export class ThemeColorValue {
    // Webiny theme color variable, like color1, color2, etc.
    private readonly name: string;
    // This can be a HEX value or a CSS variable.
    private value: string;

    constructor(value: string, name?: string) {
        this.value = value;
        this.name = name ?? "custom";
    }

    getValue() {
        return this.value;
    }

    getName() {
        return this.name;
    }

    updateFromTheme(theme: EditorTheme) {
        if (theme?.styles?.colors && this.name !== "custom") {
            this.value = theme.styles?.colors[this.name];
        }
    }
}

export const ADD_FONT_COLOR_COMMAND = createCommand<FontColorPayload>("ADD_FONT_COLOR_COMMAND");

const FontColorNodeAttrName = "data-theme-font-color-name";

export interface FontColorPayload {
    color: ThemeColorValue;
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

/**
 * Main responsibility of this node is to apply custom or Webiny theme color to selected text.
 * Extends the original TextNode node to add additional transformation and support for webiny theme font color.
 */
export class FontColorNode extends TextNode {
    private readonly __color: ThemeColorValue;

    constructor(text: string, color: ThemeColorValue, key?: string) {
        super(text, key);
        this.__color = color;
    }

    static override getType(): string {
        return "font-color-node";
    }

    static override clone(node: FontColorNode): FontColorNode {
        return new FontColorNode(node.__text, node.__color, node.__key);
    }

    static override importJSON(serializedNode: SerializedFontColorNode): TextNode {
        const node = new FontColorNode(
            serializedNode.text,
            new ThemeColorValue(serializedNode.color, serializedNode.themeColor)
        );
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    override splitText(...splitOffsets: Array<number>): Array<FontColorNode> {
        const newNodes = super.splitText(...splitOffsets);

        const selection = $getSelection();

        // After splitting, we need to re-apply styling to the new TextNodes.
        const fontColorNodes = newNodes.map(node => {
            if (node instanceof FontColorNode) {
                return node;
            }

            const fontColorNode = $createFontColorNode(node.getTextContent(), this.__color);
            $applyStylesToNode(fontColorNode, this);

            const newNode = node.replace(fontColorNode);

            // Since we're replacing the existing node, we need to update the selection keys.
            // This is very important to not break the editor functionality!
            if ($isRangeSelection(selection)) {
                const anchor = selection.anchor;
                const focus = selection.focus;

                if (anchor.key === node.getKey()) {
                    anchor.key = newNode.getKey();
                }

                if (focus.key === node.getKey()) {
                    focus.key = newNode.getKey();
                }
            }

            return newNode;
        });

        return fontColorNodes as Array<FontColorNode>;
    }

    override exportJSON(): SerializedFontColorNode {
        return {
            ...super.exportJSON(),
            themeColor: this.__color.getName(),
            color: this.__color.getValue(),
            type: "font-color-node",
            version: 1
        };
    }

    private addColorValueToHTMLElement(element: HTMLElement, theme: EditorTheme): HTMLElement {
        // Update color from webiny theme
        this.__color.updateFromTheme(theme);
        element.setAttribute(FontColorNodeAttrName, this.__color.getName());
        element.style.color = this.__color.getValue();
        return element;
    }

    override updateDOM(prevNode: FontColorNode, dom: HTMLElement, config: EditorConfig): boolean {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        this.__color.updateFromTheme(config.theme);

        dom.setAttribute(FontColorNodeAttrName, this.__color.getName());
        dom.style.color = this.__color.getValue();
        return isUpdated;
    }

    getColorStyle() {
        return {
            color: this.__color.getValue(),
            themeColor: this.__color.getName()
        };
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.addColorValueToHTMLElement(element, config.theme);
    }
}

export const $createFontColorNode = (text: string, color: ThemeColorValue): FontColorNode => {
    return new FontColorNode(text, color);
};

export const $isFontColorNode = (node: LexicalNode): node is FontColorNode => {
    return node instanceof FontColorNode;
};

export function $applyStylesToNode(node: TextNode, source: TextNode) {
    node.setFormat(source.getFormat());
    node.setStyle(source.getStyle());
}
