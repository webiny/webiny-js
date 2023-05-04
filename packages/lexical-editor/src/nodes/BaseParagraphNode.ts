/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
import { TypographyStylesNode, ThemeStyleValue } from "~/nodes/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";
import { addClassNamesToElement } from "@lexical/utils";

export type SerializeBaseParagraphNode = Spread<
    {
        type: "base_paragraph";
        styles: ThemeStyleValue[];
        version: 1;
    },
    SerializedElementNode
>;

export class BaseParagraphNode extends ElementNode implements TypographyStylesNode {
    __styles: ThemeStyleValue[] = [];

    constructor(typographyStyleId?: string, key?: NodeKey) {
        super(key);
        if (typographyStyleId) {
            this.__styles.push({ styleId: typographyStyleId, type: "typography" });
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

    getTypographyStyle(): string | undefined {
        const style = this.__styles.find(x => x.type === "typography");
        return style?.styleId || undefined;
    }

    clearTypographyStyle(): this {
        const self = super.getWritable();
        self.__styles = self.__styles.filter(s => s.type !== "typography");
        return self;
    }
    static override getType(): string {
        return "base_paragraph";
    }

    static override clone(node: BaseParagraphNode): BaseParagraphNode {
        return new BaseParagraphNode(node.getTypographyStyle(), node.__key);
    }

    updateThemeStylesToElement(element: HTMLElement, theme: WebinyTheme): HTMLElement {
        const typographyStyle = this.__styles.find(s => s.type === "typography");

        if (!typographyStyle) {
            return element;
        }

        if (!theme?.emotionMap) {
            return element;
        }
        const typography = theme.emotionMap[typographyStyle.styleId];
        if (typography) {
            addClassNamesToElement(element, typography.className);
        }

        return element;
    }

    // View
    override createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement("p");
        return this.updateThemeStylesToElement(element, config.theme as WebinyTheme);
    }

    override updateDOM(): boolean {
        return false;
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
            type: "base_paragraph",
            version: 1
        };
    }

    // Mutation

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
}

function convertParagraphElement(element: HTMLElement): DOMConversionOutput {
    const node = $createBaseParagraphNode();
    if (element.style) {
        node.setFormat(element.style.textAlign as ElementFormatType);
        const indent = parseInt(element.style.textIndent, 10) / 20;
        if (indent > 0) {
            node.setIndent(indent);
        }
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
