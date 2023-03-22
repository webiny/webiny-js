import {
    $createParagraphNode,
    createCommand,
    EditorConfig,
    ElementNode,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    ParagraphNode,
    SerializedElementNode,
    Spread
} from "lexical";
import { WebinyEditorTheme } from "~/themes/webinyLexicalTheme";
import { styleObjectToString } from "~/utils/styleObjectToString";
import { TypographyHTMLTag, TypographyValue } from "~/types";
import { findTypographyStyleById } from "~/utils/typography";

// Command and payload
export const ADD_TYPOGRAPHY_ELEMENT_COMMAND: LexicalCommand<TypographyPayload> = createCommand(
    "ADD_TYPOGRAPHY_ELEMENT_COMMAND"
);
const TypographyNodeAttrName = "data-typography-style-id";

export interface TypographyPayload {
    value: TypographyValue;
    caption?: LexicalEditor;
    key?: NodeKey;
}

// Node
export type SerializedTypographyNode = Spread<
    {
        tag: TypographyHTMLTag;
        styleId: string;
        name: string;
        typographyStyles: Record<string, any>;
        type: "typography-el-node";
        version: 1;
    },
    SerializedElementNode
>;

/**
 * Main responsibility of this node is to apply custom or Webiny theme typography to selected text.
 * Extends the original ElementNode node to add additional transformation and support for webiny theme typography.
 */
export class TypographyElementNode extends ElementNode {
    __styleId: string;
    __tag: TypographyHTMLTag;
    __name: string;
    __css: Record<string, any>;

    constructor(value: TypographyValue, key?: NodeKey) {
        super(key);
        this.__tag = value.tag;
        this.__styleId = value.id;
        this.__name = value.name;
        this.__css = value.css;
    }

    static override getType(): string {
        return "typography-el-node";
    }

    static override clone(node: TypographyElementNode): TypographyElementNode {
        return new TypographyElementNode(
            {
                css: node.__css,
                id: node.__styleId,
                name: node.__name,
                tag: node.__tag
            },
            node.__key
        );
    }

    getTypographyValue(): TypographyValue {
        return {
            tag: this.__tag,
            css: this.__css,
            id: this.__styleId,
            name: this.__name
        };
    }

    addStylesHTMLElement(element: HTMLElement, theme: WebinyEditorTheme): HTMLElement {
        const typographyStyleValue = findTypographyStyleById(theme, this.__styleId);
        if (typographyStyleValue) {
            this.__css = typographyStyleValue.css;
        }
        element.setAttribute(TypographyNodeAttrName, this.__styleId);
        element.style.cssText = styleObjectToString(this.__css);
        return element;
    }

    override exportJSON(): SerializedTypographyNode {
        return {
            ...super.exportJSON(),
            tag: this.__tag,
            typographyStyles: this.__css,
            name: this.__name,
            styleId: this.__styleId,
            type: "typography-el-node",
            version: 1
        };
    }

    static override importJSON(serializedNode: SerializedTypographyNode): TypographyElementNode {
        const node = new TypographyElementNode({
            id: serializedNode.styleId,
            css: serializedNode.typographyStyles,
            tag: serializedNode.tag,
            name: serializedNode.name
        });
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

    override updateDOM(): boolean {
        return false;
    }

    override insertNewAfter(): ParagraphNode {
        const newElement = $createParagraphNode();
        const direction = this.getDirection();
        newElement.setDirection(direction);
        this.insertAfter(newElement);
        return newElement;
    }

    override collapseAtStart(): true {
        const paragraph = $createParagraphNode();
        const children = this.getChildren();
        children.forEach(child => paragraph.append(child));
        this.replace(paragraph);
        return true;
    }
}

export const $createTypographyNode = (
    value: TypographyValue,
    key?: NodeKey
): TypographyElementNode => {
    return new TypographyElementNode(value, key);
};

export const $isTypographyElementNode = (node: ElementNode | LexicalNode | null): boolean => {
    return node instanceof TypographyElementNode;
};
