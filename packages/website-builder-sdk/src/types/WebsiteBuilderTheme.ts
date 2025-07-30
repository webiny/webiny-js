import type { LexicalEditorTheme } from "./LexicalEditorTheme";

export type Breakpoint = {
    name: string;
    title: string;
    description: string;
    icon: string;
    minWidth: number;
    maxWidth: number;
};

export type WebsiteBuilderTheme = {
    css?: string;
    cssVariables?: Record<string, string>;
    fonts?: string[];
    breakpoints: Breakpoint[];
    styles: {
        colors: Record<string, any>;
        typography: Typography;
    };
    lexical: LexicalEditorTheme;
};
type KnownKeys = "desktop" | "tablet" | "mobile";

type BreakpointBase = Omit<Breakpoint, "name">;

type KnownBreakpoints = Partial<Record<KnownKeys, Partial<BreakpointBase>>>;

// This merges both, while avoiding overlap issues
type Breakpoints = KnownBreakpoints & {
    custom?: {
        [K in string as K extends KnownKeys ? never : K]: BreakpointBase;
    };
};

// We want to allow custom strings as well, thus the (string & {}).
// eslint-disable-next-line @typescript-eslint/ban-types
export type TypographyType = "headings" | "paragraphs" | "quotes" | "lists" | (string & {});

export type TypographyStyle = {
    id: string;
    name: string;
    tag: string;
    className: string;
};

export type Typography = Partial<Record<TypographyType, Readonly<TypographyStyle[]>>>;

export type WebsiteBuilderThemeInput = {
    /**
     * CSS to include in the editor.
     */
    css?: string;
    /**
     * CSS variables to define in the editor.
     */
    cssVariables?: Record<string, string>;
    /**
     * Fonts to load when the editor loads.
     */
    fonts?: string[];
    /**
     * {
     *   title: "Desktop",
     *   description: `Desktop styles apply at all breakpoints, unless they're edited at a lower breakpoint. Start your styling here.`,
     *   icon: "Inline SVG or a link to an SVG.",
     *   minWidth: 0,
     *   maxWidth: 4000
     * }
     */
    breakpoints?: Breakpoints;
    lexical?: LexicalEditorTheme;
    styles?: {
        /**
         * color1: "#fa5723",
         * color2: "#00ccb0",
         */
        colors?: Record<string, any>;
        /**
         * headings: [
         *   {
         *     id: "heading1",
         *     name: "Heading 1",
         *     tag: "h1"
         *   },
         * ],
         * paragraphs: [
         *   {
         *     id: "paragraph1",
         *     name: "Paragraph 1",
         *     tag: "p",
         * ],
         * quotes: [
         *   {
         *     id: "quote",
         *     name: "Quote",
         *     tag: "blockquote"
         *   }
         * ]
         */
        typography?: Typography;
    };
};
