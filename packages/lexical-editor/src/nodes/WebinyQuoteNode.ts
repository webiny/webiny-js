import {
    $createParagraphNode,
    DOMConversion,
    DOMConversionMap,
    EditorConfig,
    ElementNode,
    LexicalNode,
    NodeKey,
    ParagraphNode,
    SerializedElementNode,
    Spread
} from "lexical";
import { WebinyEditorTheme, WebinyTheme } from "~/themes/webinyLexicalTheme";
import { QuoteBlockHtmlTag, WebinyThemeNode } from "~/types";
import { addClassNamesToElement } from "@lexical/utils";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";

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

    getStyleId = (): string => {
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
        const typographyValue = theme?.emotionMap
            ? theme.emotionMap[this.__themeStyleId]
            : undefined;

        if (this.__themeStyleId && typographyValue) {
            addClassNamesToElement(element, typographyValue?.className);
        }

        return element;
    }

    hasThemeStyle(): boolean {
        return this.__themeStyleId !== undefined && this.__themeStyleId.length > 0;
    }

    setDefaultQuoteThemeStyle(theme: WebinyTheme) {
        const themeEmotionMap = theme?.emotionMap;
        if (!themeEmotionMap) {
            return;
        }

        const style = findTypographyStyleByHtmlTag("quoteblock", themeEmotionMap);
        if (style) {
            this.__themeStyleId = style.id;
        }
    }

    // View
    override createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement("blockquote");
        if (!this.hasThemeStyle()) {
            this.setDefaultQuoteThemeStyle(config.theme as WebinyTheme);
        }

        addClassNamesToElement(element, config.theme.quote);
        this.addThemeStylesToHTMLElement(element, config.theme);
        return element;
    }
    override updateDOM(config: EditorConfig): boolean {
        if (!this.hasThemeStyle()) {
            this.setDefaultQuoteThemeStyle(config.theme as WebinyTheme);
        }
        return false;
    }

    static importDomConversionMap(): DOMConversion<HTMLElement> | null {
        return {
            conversion: convertBlockquoteElement,
            priority: 0
        };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            blockquote: () => {
                return this.importDomConversionMap();
            }
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

function convertBlockquoteElement() {
    const node = $createWebinyQuoteNode();
    return {
        node
    };
}

export function $createWebinyQuoteNode(themeStyleId?: string, key?: NodeKey): WebinyQuoteNode {
    return new WebinyQuoteNode(themeStyleId, key);
}

export function $isWebinyQuoteNode(node: LexicalNode | null | undefined): node is WebinyQuoteNode {
    return node instanceof WebinyQuoteNode;
}
