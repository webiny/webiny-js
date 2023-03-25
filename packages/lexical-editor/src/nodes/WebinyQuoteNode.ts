import {
    $createParagraphNode,
    DOMConversionMap,
    EditorConfig,
    ElementNode,
    LexicalNode,
    NodeKey,
    ParagraphNode,
    SerializedElementNode,
    Spread
} from "lexical";
import { WebinyEditorTheme } from "~/themes/webinyLexicalTheme";
import { findTypographyStyleById } from "~/utils/theme/typography";
import { styleObjectToString } from "~/utils/styleObjectToString";
import { QuoteBlockHtmlTag, WebinyThemeNode } from "~/types";
import { addClassNamesToElement } from "@lexical/utils";

function convertBlockquoteElement() {
    const node = $createWebinyQuoteNode();
    return {
        node
    };
}

const QuoteNodeAttrName = "data-quote-style-id";

export type SerializedWebinyQuoteNode = Spread<
    {
        tag: QuoteBlockHtmlTag;
        styleId: string;
        type: "webiny-quote";
        version: 1;
    },
    SerializedElementNode
>;

export class WebinyQuoteNode extends ElementNode implements WebinyThemeNode {
    __themeStyleId: string;

    constructor(themeStyleId?: string, key?: NodeKey) {
        super(key);
        this.__themeStyleId = themeStyleId || "";
    }

    getThemeStyleId = (): string => {
        return this.__themeStyleId;
    };

    static override getType(): string {
        return "webiny-quote";
    }

    getTag(): QuoteBlockHtmlTag {
        return "quoteblock";
    }

    static override clone(node: WebinyQuoteNode): WebinyQuoteNode {
        return new WebinyQuoteNode(node.__themeStyleId, node.__key);
    }

    addThemeStylesToHTMLElement(element: HTMLElement, theme: WebinyEditorTheme): HTMLElement {
        let css: Record<string, any> = {};
        if (this.__themeStyleId) {
            const typographyStyleValue = findTypographyStyleById(theme, this.__themeStyleId);
            if (typographyStyleValue) {
                css = typographyStyleValue.css;
            }
        }
        element.setAttribute(QuoteNodeAttrName, this.__themeStyleId || "");
        element.style.cssText = styleObjectToString(css);
        return element;
    }

    // View

    override createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement("blockquote");
        addClassNamesToElement(element, config.theme.quote);
        this.addThemeStylesToHTMLElement(element, config.theme);
        return element;
    }
    override updateDOM(): boolean {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            blockquote: () => ({
                conversion: convertBlockquoteElement,
                priority: 0
            })
        };
    }

    static override importJSON(serializedNode: SerializedWebinyQuoteNode): WebinyQuoteNode {
        const node = $createWebinyQuoteNode(serializedNode.styleId);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override exportJSON(): SerializedWebinyQuoteNode {
        return {
            ...super.exportJSON(),
            tag: "quoteblock",
            type: "webiny-quote",
            styleId: this.__themeStyleId,
            version: 1
        };
    }

    // Mutation

    override insertNewAfter(): ParagraphNode {
        const newBlock = $createParagraphNode();
        const direction = this.getDirection();
        newBlock.setDirection(direction);
        this.insertAfter(newBlock);
        return newBlock;
    }

    override collapseAtStart(): true {
        const paragraph = $createParagraphNode();
        const children = this.getChildren();
        children.forEach(child => paragraph.append(child));
        this.replace(paragraph);
        return true;
    }
}

export function $createWebinyQuoteNode(themeStyleId?: string, key?: NodeKey): WebinyQuoteNode {
    return new WebinyQuoteNode(themeStyleId, key);
}

export function $isWebinyQuoteNode(node: LexicalNode | null | undefined): node is WebinyQuoteNode {
    return node instanceof WebinyQuoteNode;
}
