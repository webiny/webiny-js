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
    fonts?: string[];
    breakpoints: Breakpoint[];
    colors: ColorStyle[];
    typography: Typography;
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

export type ColorStyle = {
    id: string;
    label: string;
    value: string;
};

export type TypographyStyle = {
    id: string;
    label: string;
    tag: string;
    className: string;
};

export type Typography = Record<string, TypographyStyle[]>;

export type WebsiteBuilderThemeInput = {
    /**
     * CSS to include in the editor.
     */
    css?: string;
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
    /**
     * [
     *   {
     *     id: "primary",
     *     label: "Primary",
     *     value: "#000000"
     *   },
     * ]
     */
    colors?: ColorStyle[];
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
