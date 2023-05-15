import { $applyNodeReplacement, LexicalNode, NodeKey, RangeSelection, Spread } from "lexical";
import { EditorConfig } from "lexical";
import { TypographyStylesNode, ThemeStyleValue, TextNodeThemeStyles } from "~/nodes/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";
import { addClassNamesToElement } from "@lexical/utils";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";
import { ThemeEmotionMap } from "~/types";
import {
    HeadingNode as BaseHeadingNode,
    HeadingTagType,
    SerializedHeadingNode as BaseSerializedHeadingNode
} from "@lexical/rich-text";
import { $createParagraphNode, ParagraphNode } from "~/nodes/ParagraphNode";

export type SerializeHeadingNode = Spread<
    {
        styles: ThemeStyleValue[];
        type: "heading-element";
    },
    BaseSerializedHeadingNode
>;

export class HeadingNode
    extends BaseHeadingNode
    implements TextNodeThemeStyles, TypographyStylesNode
{
    __styles: ThemeStyleValue[] = [];

    constructor(tag: HeadingTagType, typographyStyleId?: string, key?: NodeKey) {
        super(tag, key);

        if (typographyStyleId) {
            this.__styles.push({ styleId: typographyStyleId, type: "typography" });
        }
    }

    protected setDefaultTypography(themeEmotionMap: ThemeEmotionMap) {
        const typographyStyle = findTypographyStyleByHtmlTag(this.__tag, themeEmotionMap);
        if (typographyStyle) {
            this.__styles.push({ styleId: typographyStyle.id, type: "typography" });
        }
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
        return "heading-element";
    }

    static override clone(node: HeadingNode): HeadingNode {
        return new HeadingNode(node.getTag(), node.getTypographyStyleId(), node.__key);
    }

    protected updateElementWithThemeClasses(element: HTMLElement, theme: WebinyTheme): HTMLElement {
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

    static override importJSON(serializedNode: SerializeHeadingNode): BaseHeadingNode {
        const node = $createHeadingNode(serializedNode.tag);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        node.setThemeStyles(serializedNode.styles);
        return node;
    }

    override exportJSON(): SerializeHeadingNode {
        return {
            ...super.exportJSON(),
            styles: this.__styles,
            type: "heading-element",
            version: 1
        };
    }

    // Mutation
    override insertNewAfter(
        selection?: RangeSelection,
        restoreSelection = true
    ): ParagraphNode | HeadingNode {
        // Next line for headings are always headings with the same tag
        const newElement = $createHeadingNode(this.getTag());
        const direction = this.getDirection();
        newElement.setDirection(direction);
        this.insertAfter(newElement, restoreSelection);
        return newElement;
    }

    override collapseAtStart(): true {
        const newElement = !this.isEmpty()
            ? $createHeadingNode(this.getTag())
            : $createParagraphNode();
        const children = this.getChildren();
        children.forEach(child => newElement.append(child));
        this.replace(newElement);
        return true;
    }
}

export function $createHeadingNode(tag: HeadingTagType, typographyStyleId?: string): HeadingNode {
    return $applyNodeReplacement(new HeadingNode(tag, typographyStyleId));
}

export function $isHeadingNode(node: LexicalNode | null | undefined): node is HeadingNode {
    return node instanceof HeadingNode;
}
