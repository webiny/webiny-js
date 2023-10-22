import { CSSObject } from "@emotion/react";
export type ToolbarType = "heading" | "paragraph" | string;
export type LexicalValue = string;
export { FontColorPicker } from "~/components/ToolbarActions/FontColorAction";

export type ImageActionType = "image-action";
export type ToolbarActionType = ImageActionType | string;
export interface ToolbarActionPlugin {
    targetAction: ToolbarActionType;
    plugin: Record<string, any> | Function | undefined;
}

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

/* Commands payload types */
export { ImagePayload } from "~/commands";

/* Lexical editor interfaces */
export { RichTextEditorProps } from "~/components/Editor/RichTextEditor";

// lexical types
export { Klass, LexicalNode } from "lexical";
