export type ToolbarType = "heading" | "paragraph" | string;
export type LexicalValue = string;
export { FontColorPicker } from "~/components/ToolbarActions/FontColorAction";
// Typography
export type TypographyHTMLTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "ol" | "ul" | "div";
export type TypographyValue = {
    // CSSObject type
    css: Record<string, any>;
    id: string;
    tag: TypographyHTMLTag;
    // Display name
    name: string;
};
