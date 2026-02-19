import type {
    DOMConversion,
    DOMConversionMap,
    DOMExportOutput,
    EditorConfig,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    Spread
} from "lexical";
import { $applyNodeReplacement, addClassNamesToElement } from "lexical";
import { Theme } from "@webiny/lexical-theme";
import type { SerializedQuoteNode as BaseSerializedQuoteNode } from "@lexical/rich-text";
import { QuoteNode as BaseQuoteNode } from "@lexical/rich-text";
import type { ThemeStyleValue, TypographyStylesNode } from "~/types.js";
import { getStyleId } from "~/utils/getStyleId.js";

export type SerializedQuoteNode = Spread<
    {
        styleId?: string;
        styles?: ThemeStyleValue[];
        className?: string;
        type: "wby-quote";
    },
    BaseSerializedQuoteNode
>;

interface QuoteNodeOptions {
    className?: string;
    styleId?: string;
    key?: NodeKey;
}

export class QuoteNode extends BaseQuoteNode implements TypographyStylesNode {
    private __styleId: string | undefined;
    private __className: string | undefined;

    constructor(options: QuoteNodeOptions = {}) {
        super(options.key);
        this.__styleId = options?.styleId;
        this.__className = options?.className;
    }

    getStyleId(): string | undefined {
        return this.__styleId;
    }

    setStyleId(styleId: string | undefined) {
        this.__styleId = styleId;
    }

    setClassName(className: string | undefined) {
        this.__className = className;
    }

    getClassName(): string | undefined {
        return this.__className;
    }

    private setDefaultTypography(theme: Theme) {
        // For some time in v5 we had `quoteblock` as tag name :facepalm: We must not break it.
        const typographyStyle = theme.getTypographyByTag(["blockquote", "quoteblock"]);

        if (typographyStyle) {
            this.__styleId = typographyStyle.id;
            this.__className = typographyStyle.className;
        }
    }

    static override getType(): string {
        return "wby-quote";
    }

    static override clone(node: QuoteNode): QuoteNode {
        return new QuoteNode({
            styleId: node.getStyleId(),
            className: node.getClassName(),
            key: node.getKey()
        });
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.updateElementWithThemeClasses(element, Theme.from(config.theme));
    }

    override exportDOM(editor: LexicalEditor): DOMExportOutput {
        const base = super.exportDOM(editor);

        const element = base.element as HTMLElement;
        if (element && this.__className) {
            element.classList.add(this.__className);
        }

        return { ...base, element };
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

        const styleId = getStyleId({
            styleId: serializedNode.styleId,
            styles: serializedNode.styles
        });

        node.setStyleId(styleId);
        node.setClassName(serializedNode.className);

        return node;
    }

    override exportJSON(): SerializedQuoteNode {
        return {
            ...super.exportJSON(),
            type: "wby-quote",
            className: this.__className,
            styleId: this.__styleId
        };
    }

    protected updateElementWithThemeClasses(element: HTMLElement, theme: Theme): HTMLElement {
        if (!this.__styleId || !this.__className) {
            this.setDefaultTypography(theme);
        }

        if (this.__className) {
            addClassNamesToElement(element, this.__className);
        }

        return element;
    }
}

function convertBlockquoteElement() {
    const node = $createQuoteNode();
    return {
        node
    };
}

export function $createQuoteNode(styleId?: string, key?: NodeKey): QuoteNode {
    return $applyNodeReplacement(new QuoteNode({ styleId, key }));
}

export function $isQuoteNode(node: LexicalNode | null | undefined): node is QuoteNode {
    return node instanceof QuoteNode;
}
