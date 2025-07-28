import {
    DOMConversionMap,
    DOMConversionOutput,
    ElementFormatType,
    LexicalNode,
    NodeKey,
    ParagraphNode as BaseParagraphNode,
    SerializedParagraphNode as SerializedBaseParagraphNode,
    Spread,
    LexicalEditor,
    DOMExportOutput,
    RangeSelection
} from "lexical";
import { EditorConfig } from "lexical";
import { EditorTheme, ThemeEmotionMap, findTypographyStyleByHtmlTag } from "@webiny/lexical-theme";
import { addClassNamesToElement } from "@lexical/utils";
import { TypographyStylesNode, ThemeStyleValue } from "~/types";
import { getStyleId } from "./utils/getStyleId";

function convertParagraphElement(element: HTMLElement): DOMConversionOutput {
    const node = $createParagraphNode();
    if (element.style) {
        node.setFormat(element.style.textAlign as ElementFormatType);
    }

    return { node };
}

export type SerializeParagraphNode = Spread<
    {
        styles?: ThemeStyleValue[];
        styleId?: string;
        className?: string;
        type: "wby-paragraph";
    },
    SerializedBaseParagraphNode
>;

interface ParagraphNodeOptions {
    className?: string;
    styleId?: string;
    key?: NodeKey;
}

export class ParagraphNode extends BaseParagraphNode implements TypographyStylesNode {
    private __styleId: string | undefined;
    private __className: string | undefined;

    constructor(options: ParagraphNodeOptions = {}) {
        const { styleId, key, className } = options;
        super(key);

        this.__styleId = styleId;
        this.__className = className;
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

    static override getType(): string {
        return "wby-paragraph";
    }

    static override clone(node: ParagraphNode): ParagraphNode {
        return new ParagraphNode({
            styleId: node.getStyleId(),
            className: node.getClassName(),
            key: node.__key
        });
    }

    override insertNewAfter(
        rangeSelection: RangeSelection,
        restoreSelection: boolean
    ): ParagraphNode {
        const newElement = $createParagraphNode();
        newElement.setTextFormat(rangeSelection.format);
        newElement.setTextStyle(rangeSelection.style);
        const direction = this.getDirection();
        newElement.setDirection(direction);
        newElement.setFormat(this.getFormatType());
        newElement.setStyle(this.getStyle());
        this.insertAfter(newElement, restoreSelection);
        return newElement;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.updateElementWithThemeClasses(element, config.theme as EditorTheme);
    }

    override exportDOM(editor: LexicalEditor): DOMExportOutput {
        const base = super.exportDOM(editor);

        const element = base.element as HTMLElement;
        if (element && this.__className) {
            element.classList.add(this.__className);
        }

        return { ...base, element };
    }

    override updateDOM(prevNode: ParagraphNode, dom: HTMLElement, config: EditorConfig): boolean {
        const prevTypoStyleId = prevNode.getStyleId();
        const nextTypoStyleId = this.getStyleId();

        if (!nextTypoStyleId) {
            this.updateElementWithThemeClasses(dom, config.theme as EditorTheme);
            return false;
        }

        if (prevTypoStyleId !== nextTypoStyleId && nextTypoStyleId) {
            this.updateElementWithThemeClasses(dom, config.theme as EditorTheme);
        }
        // Returning false tells Lexical that this node does not need its
        // DOM element replacing with a new copy from createDOM.
        return false;
    }

    /*
     * On copy/paste event this method will be executed in and create a node
     * */
    static override importDOM(): DOMConversionMap | null {
        return {
            p: () => ({
                conversion: convertParagraphElement,
                priority: 0
            })
        };
    }

    /*
     * Serialize the JSON data back into a node
     */
    static override importJSON(serializedNode: SerializeParagraphNode): BaseParagraphNode {
        const node = $createParagraphNode();
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

    /*
     * Serialize the node to JSON data representation.
     * */
    override exportJSON(): SerializeParagraphNode {
        return {
            ...super.exportJSON(),
            styleId: this.__styleId,
            className: this.__className,
            type: "wby-paragraph"
        };
    }

    protected updateElementWithThemeClasses(element: HTMLElement, theme: EditorTheme): HTMLElement {
        if (!theme?.emotionMap) {
            return element;
        }

        if (!this.__styleId || !this.__className) {
            this.setDefaultTypography(theme.emotionMap);
        }

        if (this.__className) {
            addClassNamesToElement(element, this.__className);
        }

        return element;
    }

    private setDefaultTypography(themeEmotionMap: ThemeEmotionMap) {
        const typographyStyle = findTypographyStyleByHtmlTag("p", themeEmotionMap);
        if (typographyStyle) {
            this.__styleId = typographyStyle.id;
            this.__className = typographyStyle.className;
        }
    }
}

export function $createParagraphNode(styleId?: string): ParagraphNode {
    return new ParagraphNode({ styleId });
}

export function $isParagraphNode(node: LexicalNode | null | undefined): node is ParagraphNode {
    return node instanceof ParagraphNode;
}
