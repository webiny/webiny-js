import { ElementNode, LexicalNode, NodeSelection, RangeSelection, TextNode } from "lexical";
import { ListType } from "@lexical/list";
export type ToolbarType = "heading" | "paragraph" | string;
export type LexicalValue = string;
export { FontColorPicker } from "~/components/ToolbarActions/FontColorAction";

export type LexicalTextBlockType =
    | ListType
    | "paragraph"
    | "heading"
    | "quoteblock"
    | "bullet"
    | "number"
    | "link"
    | undefined;

export type TextBlockSelectionFormat = {
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
    // highlight: boolean #TODO implement with highlight action
    code: boolean;
    // nodes selection state
    link: NodeState;
    typography: NodeState;
    fontColor: NodeState;
    list: NodeState;
    quote: NodeState;
    textBlockType: LexicalTextBlockType;
};

/*
 * @description Represent set of data from the current selection of the text and nodes selected by the user.
 * You can access this object through the @see useRichTextEditor context.
 * */
export type LexicalTextSelection = {
    elementKey?: string;
    selection: RangeSelection | NodeSelection | null;
    element: LexicalNode;
    parent: ElementNode | null;
    node: ElementNode | TextNode;
    anchorNode: ElementNode | TextNode;
    isElementDom: boolean;
    state: ToolbarState | undefined;
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
