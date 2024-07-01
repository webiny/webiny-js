import {
    $applyNodeReplacement,
    DOMConversionMap,
    DOMConversionOutput,
    ElementFormatType,
    LexicalNode,
    NodeKey,
    ParagraphNode as BaseParagraphNode,
    SerializedParagraphNode as SerializedBaseParagraphNode,
    Spread
} from "lexical";
import { EditorConfig } from "lexical";
import { WebinyTheme, ThemeEmotionMap, findTypographyStyleByHtmlTag } from "@webiny/lexical-theme";
import { addClassNamesToElement } from "@lexical/utils";
import { TypographyStylesNode, ThemeStyleValue, TextNodeThemeStyles } from "~/types";

export type SerializeParagraphNode = Spread<
    {
        styles: ThemeStyleValue[];
        type: "paragraph-element";
    },
    SerializedBaseParagraphNode
>;

export class ParagraphNode
    extends BaseParagraphNode
    implements TextNodeThemeStyles, TypographyStylesNode
{
    __styles: ThemeStyleValue[] = [];

    constructor(typographyStyleId?: string, key?: NodeKey) {
        super(key);

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

    getTypographyStyleId(): string | undefined {
        const style = this.__styles.find(x => x.type === "typography");
        return style?.styleId || undefined;
    }

    private hasTypographyStyle(): boolean {
        return !!this.getTypographyStyleId();
    }

    getThemeStyles(): ThemeStyleValue[] {
        // getLatest() ensures we are getting the most
        // up-to-date value from the EditorState.
        const self = super.getLatest();
        return self.__styles;
    }

    setThemeStyles(styles: ThemeStyleValue[]) {
        // getWritable() creates a clone of the node
        // if needed, to ensure we don't try and mutate
        // a stale version of this node.
        const self = super.getWritable();
        self.__styles = [...styles];
        return self;
    }

    static override getType(): string {
        return "paragraph-element";
    }

    static override clone(node: ParagraphNode): ParagraphNode {
        return new ParagraphNode(node.getTypographyStyleId(), node.__key);
    }

    private updateElementWithThemeClasses(element: HTMLElement, theme: WebinyTheme): HTMLElement {
        if (!theme?.emotionMap) {
            return element;
        }

        if (!this.hasTypographyStyle()) {
            this.setDefaultTypography(theme.emotionMap);
        }

        const typoStyleId = this.getTypographyStyleId();

        let themeClasses;

        // Typography css class
        if (typoStyleId) {
            const typographyStyle = theme.emotionMap[typoStyleId];
            if (typographyStyle) {
                themeClasses = typographyStyle.className;
            }
        }

        if (themeClasses) {
            addClassNamesToElement(element, themeClasses);
        }

        return element;
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.updateElementWithThemeClasses(element, config.theme as WebinyTheme);
    }

    override updateDOM(prevNode: ParagraphNode, dom: HTMLElement, config: EditorConfig): boolean {
        const prevTypoStyleId = prevNode.getTypographyStyleId();
        const nextTypoStyleId = this.getTypographyStyleId();

        if (!nextTypoStyleId) {
            this.updateElementWithThemeClasses(dom, config.theme as WebinyTheme);
            return false;
        }

        if (prevTypoStyleId !== nextTypoStyleId && nextTypoStyleId) {
            this.updateElementWithThemeClasses(dom, config.theme as WebinyTheme);
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
        node.setThemeStyles(serializedNode.styles);
        return node;
    }

    /*
     * Serialize the node to JSON data representation.
     * */
    override exportJSON(): SerializeParagraphNode {
        return {
            ...super.exportJSON(),
            styles: this.__styles,
            type: "paragraph-element",
            version: 1
        };
    }
}

function convertParagraphElement(element: HTMLElement): DOMConversionOutput {
    const node = $createParagraphNode();
    if (element.style) {
        node.setFormat(element.style.textAlign as ElementFormatType);
    }

    return { node };
}

export function $createParagraphNode(typographyStyleId?: string): ParagraphNode {
    return $applyNodeReplacement(new ParagraphNode(typographyStyleId));
}

export function $isParagraphNode(node: LexicalNode | null | undefined): node is ParagraphNode {
    return node instanceof ParagraphNode;
}
