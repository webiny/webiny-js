export type ToolbarType = "heading" | "paragraph" | string;
export type LexicalValue = string;
export { FontColorPicker } from "~/components/ToolbarActions/FontColorAction";
// Typography
export type TypographyHTMLTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
export type TypographyValue = {
    // CSSObject type
    styleObject: Record<string, any>;
    // variable name defined in the theme
    themeTypographyName: string;
    htmlTag: TypographyHTMLTag;
};
