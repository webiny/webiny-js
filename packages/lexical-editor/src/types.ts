import { ElementNode, LexicalNode, NodeSelection, RangeSelection, TextNode } from "lexical";
import { ListType } from "@lexical/list";
import { CSSObject } from "@emotion/react";
export type ToolbarType = "heading" | "paragraph" | string;
export type LexicalValue = string;
export { FontColorPicker } from "~/components/ToolbarActions/FontColorAction";

export type LexicalTextType =
    | ListType
    | "paragraph"
    | "heading"
    | "quoteblock"
    | "bullet"
    | "number"
    | "link"
    | undefined;

export type TextFormatting = {
    bold: boolean;
    underline: boolean;
    italic: boolean;
    // highlight: boolean #TODO implement with highlight action
    code: boolean;
};

export type NodeState = {
    isSelected: boolean;
};

export type ToolbarState = {
    // text format
    bold: boolean;
    underline: boolean;
    italic: boolean;
    code: boolean;
    // nodes selection state
    link: NodeState;
    typography: NodeState;
    fontColor: NodeState;
    list: NodeState;
    quote: NodeState;
    textType: LexicalTextType;
    baseParagraph: NodeState;
    baseHeading: NodeState;
};

/*
 * Represent set of data from the current selection of the text and nodes selected by the user.
 * You can access this object through the @see useRichTextEditor context.
 */
export type TextBlockSelection = {
    elementKey?: string;
    selection: RangeSelection | NodeSelection | null;
    element: LexicalNode;
    parent: ElementNode | null;
    node: ElementNode | TextNode;
    anchorNode: ElementNode | TextNode;
    isElementDom: boolean;
    state: ToolbarState | undefined;
};

// Supported HTML tags by webiny lexical implementation
export type ListHtmlTag = "ol" | "ul";
export type HeadingHtmlTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type ParagraphHtmlTag = "p";
export type QuoteBlockHtmlTag = "quoteblock";

// Typography
export type TypographyHTMLTag = HeadingHtmlTag | ParagraphHtmlTag | ListHtmlTag | QuoteBlockHtmlTag;

export type TypographyValue = {
    // CSSObject type
    css: CSSObject;
    id: string;
    tag: TypographyHTMLTag;
    // Display name
    name: string;
};

/* Nodes */
export interface WebinyThemeNode {
    /*
     * Get theme style id
     */
    getStyleId: () => string;
}

/*
 * Contains IDs of the styles and Emotion generated classes.
 */
export type ThemeEmotionMap = {
    [styleId: string]: {
        id: string;
        tag: TypographyHTMLTag;
        name: string;
        styles: Record<string, any>;
        // emotion generated class
        className: string;
    };
};
