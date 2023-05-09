import {
    $applyNodeReplacement,
    $isTextNode,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    ElementFormatType,
    ElementNode,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    RangeSelection,
    SerializedElementNode,
    Spread
} from "lexical";
import { EditorConfig } from "lexical";
import { TypographyStylesNode, ThemeStyleValue, TextNodeThemeStyles } from "~/nodes/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";
import { addClassNamesToElement } from "@lexical/utils";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";
import { ThemeEmotionMap } from "~/types";

export type SerializeBaseParagraphNode = Spread<
    {
        styles: ThemeStyleValue[];
        type: "base-paragraph-node";
        version: 1;
    },
    SerializedElementNode
>;

export class BaseParagraphNode
    extends ElementNode
    implements TextNodeThemeStyles, TypographyStylesNode
{
    __styles: ThemeStyleValue[] = [];

    constructor(typographyStyleId?: string, key?: NodeKey) {
        super(key);
        debugger;
        if (typographyStyleId) {
            this.__styles.push({ styleId: typographyStyleId, type: "typography" });
        }
    }

    protected setDefaultTypography(themeEmotionMap: ThemeEmotionMap) {
        const typographyStyle = findTypographyStyleByHtmlTag("p", themeEmotionMap);
        if (typographyStyle) {
            this.__styles.push({ styleId: typographyStyle.id, type: "typography" });
        }
    }

    setTypography(typographyStyleId: string): this {
        const self = super.getWritable();
        const themeStyle = {
            styleId: typographyStyleId,
            type: "typography"
        } as ThemeStyleValue;
        self.__styles.push(themeStyle);
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

    static override getType(): string {
        return "base-paragraph-node";
    }

    static override clone(node: BaseParagraphNode): BaseParagraphNode {
        return new BaseParagraphNode(node.getTypographyStyleId(), node.__key);
    }

    protected addThemeStyleToElement(element: HTMLElement, theme: WebinyTheme): HTMLElement {
        debugger;
        if (!this.hasTypographyStyle() && theme?.emotionMap) {
            this.setDefaultTypography(theme.emotionMap);
            const styleId = this.getTypographyStyleId();
            // in this case default style can't be found for paragraph node
            if (!styleId) {
                return element;
            }
            const typographyStyle = theme.emotionMap[styleId];
            if (typographyStyle) {
                addClassNamesToElement(element, typographyStyle.className);
            }
        }

        return element;
    }

    protected updateElementThemeStyle(element: HTMLElement, theme: WebinyTheme): HTMLElement {
        if (!this.hasTypographyStyle()) {
            return this.addThemeStyleToElement(element, theme);
        }

        if (theme?.emotionMap) {
            const styleId = this.getTypographyStyleId();
            // in this case default style can't be found for paragraph node
            if (!styleId) {
                return element;
            }

            const typographyStyle = theme.emotionMap[styleId];
            if (typographyStyle) {
                addClassNamesToElement(element, typographyStyle.className);
            }
        }
        return element;
    }

    // View
    override createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement("p");
        debugger;
        if (!this.hasTypographyStyle()) {
            return this.addThemeStyleToElement(element, config.theme as WebinyTheme);
        }
        return this.updateElementThemeStyle(element, config.theme as WebinyTheme);
    }

    override updateDOM(
        prevNode: BaseParagraphNode,
        dom: HTMLElement,
        config: EditorConfig
    ): boolean {
        debugger;
        this.updateElementThemeStyle(dom, config.theme as WebinyTheme);
        return true;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            p: () => ({
                conversion: convertParagraphElement,
                priority: 0
            })
        };
    }

    override exportDOM(editor: LexicalEditor): DOMExportOutput {
        const { element } = super.exportDOM(editor);

        if (element && this.isEmpty()) {
            element.append(document.createElement("br"));
        }
        if (element) {
            const formatType = this.getFormatType();
            element.style.textAlign = formatType;

            const direction = this.getDirection();
            if (direction) {
                element.dir = direction;
            }
            const indent = this.getIndent();
            if (indent > 0) {
                // padding-inline-start is not widely supported in email HTML, but
                // Lexical Reconciler uses padding-inline-start. Using text-indent instead.
                element.style.textIndent = `${indent * 20}px`;
            }
        }

        return {
            element
        };
    }

    static override importJSON(serializedNode: SerializeBaseParagraphNode): BaseParagraphNode {
        const styleValue = serializedNode.styles.find(s => s.type === "typography");
        const node = styleValue
            ? $createBaseParagraphNode(styleValue.styleId)
            : $createBaseParagraphNode();
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        node.styles = serializedNode.styles;
        return node;
    }

    override exportJSON(): SerializeBaseParagraphNode {
        return {
            ...super.exportJSON(),
            styles: this.__styles,
            type: "base-paragraph-node",
            version: 1
        };
    }

    override insertNewAfter(_: RangeSelection, restoreSelection: boolean): BaseParagraphNode {
        const newElement = $createBaseParagraphNode();
        const direction = this.getDirection();
        newElement.setDirection(direction);
        this.insertAfter(newElement, restoreSelection);
        return newElement;
    }

    override collapseAtStart(): boolean {
        const children = this.getChildren();
        // If we have an empty (trimmed) first paragraph and try and remove it,
        // delete the paragraph as long as we have another sibling to go to
        if (
            children.length === 0 ||
            ($isTextNode(children[0]) && children[0].getTextContent().trim() === "")
        ) {
            const nextSibling = this.getNextSibling();
            if (nextSibling !== null) {
                this.selectNext();
                this.remove();
                return true;
            }
            const prevSibling = this.getPreviousSibling();
            if (prevSibling !== null) {
                this.selectPrevious();
                this.remove();
                return true;
            }
        }
        return false;
    }

    getThemeStyles(): ThemeStyleValue[] {
        return this.__styles;
    }
}

function convertParagraphElement(element: HTMLElement): DOMConversionOutput {
    debugger;
    const node = $createBaseParagraphNode();
    if (element.style) {
        node.setFormat(element.style.textAlign as ElementFormatType);
    }
    return { node };
}

export function $createBaseParagraphNode(typographyStyleId?: string): BaseParagraphNode {
    return $applyNodeReplacement(new BaseParagraphNode(typographyStyleId));
}

export function $isBaseParagraphNode(
    node: LexicalNode | null | undefined
): node is BaseParagraphNode {
    return node instanceof BaseParagraphNode;
}
