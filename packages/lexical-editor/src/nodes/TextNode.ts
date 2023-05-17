import {
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedTextNode as BaseSerializedTextNode,
    Spread,
    TextNode as BaseTextNode
} from "lexical";
import { WebinyEditorTheme } from "~/themes/webinyLexicalTheme";
import {TextNodeThemeStyles, ThemeStyleValue} from "~/nodes/types";
import {FontColorNode} from "~/nodes/FontColorNode";
import {errorOnReadOnly} from "lexical/LexicalUpdates";
import {$getCompositionKey} from "lexical/LexicalUtils";

export type SerializedFontColorNode = Spread<
    {
        styles: ThemeStyleValue[],
        type: "wtext-node";
        version: 1;
    },
    BaseSerializedTextNode
>;

/**
 * Extends the original TextNode node to add additional transformation and support for webiny theme styles.
 */
export class TextNode extends BaseTextNode implements TextNodeThemeStyles {

    __styles: ThemeStyleValue[] = [];

    constructor(text: string, styles?: ThemeStyleValue[], key?: NodeKey) {
        super(text, key);
        this.__styles = styles ? [...styles] : [];
    }

    static override getType(): string {
        return "wtext-node";
    }

    static override clone(node: TextNode): TextNode {
        return new TextNode(node.__text, node.__styles, node.__key);
    }

    static override importJSON(serializedNode: SerializedFontColorNode): TextNode {
        const node = new TextNode(
            serializedNode.text,
            serializedNode.styles
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
            styles: this.__styles,
            type: "wtext-node",
            version: 1
        };
    }

    getThemeStyles(): ThemeStyleValue[] {
        // getLatest() ensures we are getting the most
        // up-to-date value from the EditorState.
        const self = super.getLatest();
        return self.__styles;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.addColorValueToHTMLElement(element, config.theme);
    }

    setThemeStyles(styles: ThemeStyleValue[]): this {
        // getWritable() creates a clone of the node
        // if needed, to ensure we don't try and mutate
        // a stale version of this node.
        const self = super.getWritable();
        self.__styles = [...styles];
        return self;
    }

}

