import {
    DOMConversion,
    DOMConversionMap,
    EditorConfig,
    LexicalNode,
    NodeKey,
    Spread
} from "lexical";
import {
    EditorTheme,
    ThemeEmotionMap,
    WebinyTheme,
    findTypographyStyleByHtmlTag
} from "@webiny/lexical-theme";
import { addClassNamesToElement } from "@lexical/utils";
import {
    QuoteNode as BaseQuoteNode,
    SerializedQuoteNode as BaseSerializedQuoteNode
} from "@lexical/rich-text";
import { TextNodeThemeStyles, ThemeStyleValue, TypographyStylesNode } from "~/types";

export type SerializedQuoteNode = Spread<
    {
        styleId?: string;
        styles: ThemeStyleValue[];
        type: "webiny-quote";
    },
    BaseSerializedQuoteNode
>;

export class QuoteNode extends BaseQuoteNode implements TextNodeThemeStyles, TypographyStylesNode {
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
        if (!typographyStyleId) {
            return self;
        }

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

    static override clone(node: QuoteNode): QuoteNode {
        return new QuoteNode(node.getTypographyStyleId(), node.__key);
    }

    addThemeStylesToHTMLElement(element: HTMLElement, theme: EditorTheme): HTMLElement {
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

    static override importJSON(serializedNode: SerializedQuoteNode): QuoteNode {
        const node = $createQuoteNode();
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        if (!!serializedNode?.styles?.length) {
            node.setThemeStyles(serializedNode.styles);
            return node;
        }
        // for old nodes data migrate the style id into the list
        if (!!serializedNode?.styleId) {
            const styles = [
                { styleId: serializedNode.styleId, type: "typography" }
            ] as ThemeStyleValue[];
            node.setThemeStyles(styles);
        }
        return node;
    }

    override exportJSON(): SerializedQuoteNode {
        return {
            ...super.exportJSON(),
            type: "webiny-quote",
            styles: this.__styles,
            styleId: this.getTypographyStyleId()
        };
    }
}

function convertBlockquoteElement() {
    const node = $createQuoteNode();
    return {
        node
    };
}

export function $createQuoteNode(themeStyleId?: string, key?: NodeKey): QuoteNode {
    return new QuoteNode(themeStyleId, key);
}

export function $isQuoteNode(node: LexicalNode | null | undefined): node is QuoteNode {
    return node instanceof QuoteNode;
}
