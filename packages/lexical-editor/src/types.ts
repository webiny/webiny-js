import { ElementNode, LexicalNode, NodeSelection, RangeSelection, TextNode } from "lexical";
export type ToolbarType = "heading" | "paragraph" | string;
export type LexicalValue = string;
export { FontColorPicker } from "~/components/ToolbarActions/FontColorAction";
export type LexicalTextBlockType = "paragraph" | "heading" | "quoteblock" | "bullet" | "numbered";

export type NodeFormatting = {
    textFormat: string;
};

export type FontColorFormatting = NodeFormatting & {
    themeStyleId: string;
    color: string;
};

export type TypographyFormatting = NodeFormatting & {
    value: TypographyValue;
};

export type BlockSelectionTextFormat = {
    bold: boolean;
    underline: boolean;
    italic: boolean;
    // highlight: boolean #TODO implement with highlight action
    code: boolean;
};

export type BlockSelectionStyleFormat = {
    color: string;
    fontSize: number | string;
};

/*
 * @description Represent set of data from the current selection of the text and nodes selected by the user.
 * You can access this object through the @see useRichTextEditor context.
 * */
export type TextBlockSelection = {
    elementKey?: string;
    blockType: LexicalTextBlockType;
    selection: RangeSelection | NodeSelection | null;
    element: LexicalNode;
    parentElement: ElementNode | null;
    node: ElementNode | TextNode;
    textFormat: BlockSelectionTextFormat;
    isElementDom: boolean;
};

// Typography
export type TypographyHTMLTag =
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "p"
    | "ol"
    | "ul"
    | "quoteblock";
export type TypographyValue = {
    // CSSObject type
    css: Record<string, any>;
    id: string;
    tag: TypographyHTMLTag;
    // Display name
    name: string;
};

