import {
    $createParagraphNode,
    DOMConversion,
    DOMConversionMap,
    EditorConfig,
    LexicalNode,
    NodeKey,
    ParagraphNode,
    Spread
} from "lexical";
import { WebinyEditorTheme, WebinyTheme } from "~/themes/webinyLexicalTheme";
import { ThemeEmotionMap } from "~/types";
import { addClassNamesToElement } from "@lexical/utils";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";
import { QuoteNode, SerializedQuoteNode } from "@lexical/rich-text";
import { TextNodeThemeStyles, ThemeStyleValue, TypographyStylesNode } from "~/nodes/types";

export type SerializedWebinyQuoteNode = Spread<
    {
        styleId: string;
        type: "webiny-quote";
    },
    SerializedQuoteNode
>;

export class BaseQuoteNode extends QuoteNode implements TextNodeThemeStyles, TypographyStylesNode {
    __styles: ThemeStyleValue[] = [];

    constructor(themeStyleId?: string, key?: NodeKey) {
        super(key);
        if (themeStyleId) {
            this.__styles.push({ styleId: themeStyleId, type: "typography" });
        }
    }

    /*
     * Find the first occurrence of the quoteblock in the theme styles and set as default.
     */
    protected setDefaultTypography(themeEmotionMap: ThemeEmotionMap) {
        const typographyStyle = findTypographyStyleByHtmlTag("quoteblock", themeEmotionMap);
        if (typographyStyle) {
            this.__styles.push({ styleId: typographyStyle.id, type: "typography" });
        }
    }

    /*
     * Checks if the current typography style id is exist in the theme styles map
     */
    protected typographyStyleExist(themeEmotionMap: ThemeEmotionMap): boolean {
        const styleId = this.getTypographyStyleId();
        if (!styleId) {
            return false;
        }
        const style = themeEmotionMap[styleId];
        return !!style;
    }

    setTypography(typographyStyleId: string): this {
        const self = super.getWritable();
        if (!this.hasTypographyStyle()) {
            const themeStyle = {
                styleId: typographyStyleId,
                type: "typography"
            } as ThemeStyleValue;
            self.__styles.push(themeStyle);
        }
        return self;
    }

    getTypographyStyleId(): string | undefined {
        const style = this.__styles.find(x => x.type === "typography");
        return style?.styleId || undefined;
    }

    clearTypographyStyle(): this {
        const self = super.getWritable();
        self.__styles = self.__styles.filter(s => s.type !== "typography");
        return self;
    }

    hasTypographyStyle(): boolean {
        return !!this.getTypographyStyleId();
    }

    getThemeStyles(): ThemeStyleValue[] {
        const self = super.getLatest();
        return self.__styles;
    }

    setThemeStyles(styles: ThemeStyleValue[]) {
        const self = super.getWritable();
        self.__styles = [...styles];
        return self;
    }

    static override getType(): string {
        return "webiny-quote";
    }

    static override clone(node: BaseQuoteNode): BaseQuoteNode {
        return new BaseQuoteNode(node.getTypographyStyleId(), node.__key);
    }

    addThemeStylesToHTMLElement(element: HTMLElement, theme: WebinyEditorTheme): HTMLElement {
        const themeEmotionMap = theme?.emotionMap;

        if (!themeEmotionMap) {
            return element;
        }

        // style exist and is in active use
        if (this.hasTypographyStyle() && this.typographyStyleExist(themeEmotionMap)) {
            const styleId = this.getTypographyStyleId();
            if (styleId) {
                const typographyValue = themeEmotionMap[styleId];
                addClassNamesToElement(element, typographyValue?.className);
                return element;
            }
        }

        return element;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        const wTheme = config.theme as WebinyTheme;
        const emotionThemeMap = wTheme?.emotionMap;

        if (!emotionThemeMap) {
            return element;
        }

        // if styleId is not set or user removed the style from theme, set default style
        if (!this.hasTypographyStyle() || !this.typographyStyleExist(emotionThemeMap)) {
            this.setDefaultTypography(emotionThemeMap);
        }

        addClassNamesToElement(element, config.theme.quote);
        this.addThemeStylesToHTMLElement(element, config.theme);
        return element;
    }

    static importDomConversionMap(): DOMConversion<HTMLElement> | null {
        return {
            conversion: convertBlockquoteElement,
            priority: 0
        };
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            blockquote: () => {
                return this.importDomConversionMap();
            }
        };
    }

    static override importJSON(serializedNode: SerializedWebinyQuoteNode): BaseQuoteNode {
        const node = $createBaseQuoteNode(serializedNode.styleId);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override exportJSON(): SerializedWebinyQuoteNode {
        return {
            ...super.exportJSON(),
            type: "webiny-quote",
            styleId: this.getTypographyStyleId() || ""
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
    const node = $createBaseQuoteNode();
    return {
        node
    };
}

export function $createBaseQuoteNode(themeStyleId?: string, key?: NodeKey): BaseQuoteNode {
    return new BaseQuoteNode(themeStyleId, key);
}

export function $isBaseQuoteNode(node: LexicalNode | null | undefined): node is BaseQuoteNode {
    return node instanceof BaseQuoteNode;
}
