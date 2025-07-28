import {
    EditorConfig,
    $applyNodeReplacement,
    LexicalNode,
    NodeKey,
    RangeSelection,
    Spread,
    LexicalEditor,
    DOMExportOutput,
    setNodeIndentFromDOM,
    DOMConversionMap
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";
import {
    HeadingNode as BaseHeadingNode,
    HeadingTagType,
    SerializedHeadingNode as BaseSerializedHeadingNode
} from "@lexical/rich-text";
import { EditorTheme, ThemeEmotionMap, findTypographyStyleByHtmlTag } from "@webiny/lexical-theme";
import { ParagraphNode } from "~/ParagraphNode";
import { TypographyStylesNode, ThemeStyleValue } from "~/types";
import { getStyleId } from "~/utils/getStyleId";

export type SerializeHeadingNode = Spread<
    {
        styles?: ThemeStyleValue[];
        styleId?: string;
        className?: string;
        type: "wby-heading";
    },
    BaseSerializedHeadingNode
>;

interface HeadingNodeOptions {
    className?: string;
    styleId?: string;
    key?: NodeKey;
}

function isGoogleDocsTitle(domNode: HTMLElement) {
    if (domNode.nodeName.toLowerCase() === "span") {
        return domNode.style.fontSize === "26pt";
    }
    return false;
}
function $convertHeadingElement(element: HTMLElement) {
    const nodeName = element.nodeName.toLowerCase();
    let node = null;
    if (
        nodeName === "h1" ||
        nodeName === "h2" ||
        nodeName === "h3" ||
        nodeName === "h4" ||
        nodeName === "h5" ||
        nodeName === "h6"
    ) {
        node = $createHeadingNode(nodeName);
        if (element.style !== null) {
            setNodeIndentFromDOM(element, node);
            node.setFormat(element.style.textAlign as any);
        }
    }
    return {
        node
    };
}

export class HeadingNode extends BaseHeadingNode implements TypographyStylesNode {
    private __styleId: string | undefined;
    private __className: string | undefined;

    constructor(tag: HeadingTagType, options: HeadingNodeOptions = {}) {
        const { styleId, key, className } = options;

        super(tag, key);

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
        return "wby-heading";
    }

    static override clone(node: HeadingNode): HeadingNode {
        return new HeadingNode(node.getTag(), {
            key: node.getKey(),
            styleId: node.getStyleId(),
            className: node.getClassName()
        });
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

    static override importDOM(): DOMConversionMap | null {
        return {
            h1: () => ({
                conversion: $convertHeadingElement,
                priority: 0
            }),
            h2: () => ({
                conversion: $convertHeadingElement,
                priority: 0
            }),
            h3: () => ({
                conversion: $convertHeadingElement,
                priority: 0
            }),
            h4: () => ({
                conversion: $convertHeadingElement,
                priority: 0
            }),
            h5: () => ({
                conversion: $convertHeadingElement,
                priority: 0
            }),
            h6: () => ({
                conversion: $convertHeadingElement,
                priority: 0
            }),
            p: node => {
                // domNode is a <p> since we matched it by nodeName
                const firstChild = node.firstChild as HTMLElement;
                if (firstChild !== null && isGoogleDocsTitle(firstChild)) {
                    return {
                        conversion: () => ({
                            node: null
                        }),
                        priority: 3
                    };
                }
                return null;
            },
            span: node => {
                if (isGoogleDocsTitle(node)) {
                    return {
                        conversion: () => {
                            return {
                                node: $createHeadingNode("h1")
                            };
                        },
                        priority: 3
                    };
                }
                return null;
            }
        };
    }

    static override importJSON(serializedNode: SerializeHeadingNode): BaseHeadingNode {
        const node = $createHeadingNode(serializedNode.tag);
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

    override exportJSON(): SerializeHeadingNode {
        return {
            ...super.exportJSON(),
            type: "wby-heading",
            styleId: this.__styleId,
            className: this.__className
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
        const newElement = $createHeadingNode(this.getTag());
        const children = this.getChildren();
        children.forEach(child => newElement.append(child));
        this.replace(newElement);
        return true;
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
        const typographyStyle = findTypographyStyleByHtmlTag(this.getTag(), themeEmotionMap);
        if (typographyStyle) {
            this.__styleId = typographyStyle.id;
            this.__className = typographyStyle.className;
        }
    }
}

export function $createHeadingNode(tag: HeadingTagType, styleId?: string): HeadingNode {
    return $applyNodeReplacement(new HeadingNode(tag, { styleId }));
}

export function $isHeadingNode(node: LexicalNode | null | undefined): node is HeadingNode {
    return node instanceof HeadingNode;
}
