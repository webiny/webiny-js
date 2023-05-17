import {
    $createTextNode, $getSelection, $isRangeSelection, $setCompositionKey,
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
import {errorOnReadOnly} from "lexical/LexicalUpdates";
import {$getCompositionKey, internalMarkSiblingsAsDirty} from "lexical/LexicalUtils";
import {$updateElementSelectionOnCreateDeleteNode} from "lexical/LexicalSelection";

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

    setThemeStyle(color: string, themeColor?: ThemeColor): this {
        const self = this.getWritable();
        self.__themeColor = themeColor || "custom";
        self.__color = color;
        return self;
    }

/*    override splitText(...splitOffsets: number[]): Array<FontColorNode> {
        errorOnReadOnly();
        const self = this.getLatest();
        const textContent = self.getTextContent();
        const key = self.__key;
        const compositionKey = $getCompositionKey();
        const offsetsSet = new Set(splitOffsets);
        const parts = [];
        const textLength = textContent.length;
        let string = '';
        for (let i = 0; i < textLength; i++) {
            if (string !== '' && offsetsSet.has(i)) {
                parts.push(string);
                string = '';
            }
            string += textContent[i];
        }
        if (string !== '') {
            parts.push(string);
        }
        const partsLength = parts.length;
        if (partsLength === 0) {
            return [];
        } else if (parts[0] === textContent) {
            return [self];
        }
        const firstPart = parts[0];
        const parent = self.getParentOrThrow();
        let writableNode;
        const format = self.getFormat();
        const style = self.getStyle();
        const detail = self.__detail;
        let hasReplacedSelf = false;

        if (self.isSegmented()) {
            // Create a new TextNode
            writableNode = $createFontColorNode(firstPart, this.__color, this.__themeColor);
            writableNode.__format = format;
            writableNode.__style = style;
            writableNode.__detail = detail;
            hasReplacedSelf = true;
        } else {
            // For the first part, update the existing node
            writableNode = self.getWritable();
            writableNode.__text = firstPart;
        }

        // Handle selection
        const selection = $getSelection();

        // Then handle all other parts
        const splitNodes: FontColorNode[] = [writableNode];
        let textSize = firstPart.length;

        for (let i = 1; i < partsLength; i++) {
            const part = parts[i];
            const partSize = part.length;
            const sibling = $createFontColorNode(part, this.__color, this.__themeColor).getWritable();
            sibling.__format = format;
            sibling.__style = style;
            sibling.__detail = detail;
            const siblingKey = sibling.__key;
            const nextTextSize = textSize + partSize;

            if ($isRangeSelection(selection)) {
                const anchor = selection.anchor;
                const focus = selection.focus;

                if (
                    anchor.key === key &&
                    anchor.type === 'text' &&
                    anchor.offset > textSize &&
                    anchor.offset <= nextTextSize
                ) {
                    anchor.key = siblingKey;
                    anchor.offset -= textSize;
                    selection.dirty = true;
                }
                if (
                    focus.key === key &&
                    focus.type === 'text' &&
                    focus.offset > textSize &&
                    focus.offset <= nextTextSize
                ) {
                    focus.key = siblingKey;
                    focus.offset -= textSize;
                    selection.dirty = true;
                }
            }
            if (compositionKey === key) {
                $setCompositionKey(siblingKey);
            }
            textSize = nextTextSize;
            splitNodes.push(sibling);
        }

        // Insert the nodes into the parent's children
        internalMarkSiblingsAsDirty(this);
        const writableParent = parent.getWritable();
        const insertionIndex = this.getIndexWithinParent();
        if (hasReplacedSelf) {
            writableParent.splice(insertionIndex, 0, splitNodes);
            this.remove();
        } else {
            writableParent.splice(insertionIndex, 1, splitNodes);
        }

        if ($isRangeSelection(selection)) {
            $updateElementSelectionOnCreateDeleteNode(
                selection,
                parent,
                insertionIndex,
                partsLength - 1,
            );
        }

        return splitNodes;
    }*/

    addColorValueToHTMLElement(element: HTMLElement, theme: WebinyEditorTheme): HTMLElement {
        const hasThemeColor = this.__themeColor !== "custom";

        // get the updated color from webiny theme
        if (hasThemeColor && theme?.styles?.colors) {
            this.__color = theme.styles.colors[this.__themeColor];
        }

        element.setAttribute(FontColorNodeAttrName, this.__themeColor);
        element.style.color = this.__color;

        return element;
    }

    /* override updateDOM(prevNode: FontColorNode, dom: HTMLElement, config: EditorConfig): boolean {
         const theme = config.theme;
         const isUpdated = super.updateDOM(prevNode, dom, config);
         const hasThemeColor = this.__themeColor !== "custom";
         // get the updated color from webiny theme
         if (hasThemeColor && theme?.styles?.colors) {
             this.__color = theme.styles.colors[this.__themeColor];
         }
         dom.style.color = this.__color;
         return isUpdated;
        return
    }*/

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

    override updateDOM(prevNode: FontColorNode, dom: HTMLElement, config: EditorConfig): boolean {
        this.addColorValueToHTMLElement(dom, config.theme);
        return true;
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

export const $isFontColorNode = (node:  LexicalNode | null | undefined): boolean => {
    return node instanceof FontColorNode;
};

export function $applyStylesToNode(node: FontColorNode, nodeStyleProvider: RangeSelection) {
    node.setFormat(nodeStyleProvider.format);
    node.setStyle(nodeStyleProvider.style);
}
