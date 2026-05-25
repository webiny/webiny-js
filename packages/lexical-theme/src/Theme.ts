import type { EditorThemeClasses } from "lexical";
import type {
    ColorValue,
    FontSizes,
    EditorTheme,
    TypographyMap,
    TypographyValue
} from "~/types.js";

type InternalProps = {
    $colors: EditorTheme["colors"];
    $fontSizes: EditorTheme["fontSizes"];
    $typography: EditorTheme["typography"];
    $cacheKey: string;
};

type InternalTheme = EditorThemeClasses & InternalProps;

export class Theme {
    static cache: Record<string, Theme> = {};
    static lastUsedTheme: Theme | null = null;
    public readonly tokens: EditorThemeClasses;
    private readonly _colors: ColorValue[];
    private readonly _fontSizes: FontSizes;
    private readonly _typography: Record<string, TypographyValue[]>;
    private readonly _typographyMap: TypographyMap;

    constructor(params: {
        colors: EditorTheme["colors"];
        typography: EditorTheme["typography"];
        fontSizes: EditorTheme["fontSizes"];
        tokens: EditorThemeClasses;
    }) {
        this._colors = params.colors;
        this._typography = params.typography;
        this._fontSizes = params.fontSizes;
        this._typographyMap = this.toTypographyMap(params.typography);
        this.tokens = params.tokens;
    }

    static empty() {
        return new Theme({ colors: [], typography: {}, fontSizes: [], tokens: {} });
    }

    static from(lexicalTheme: EditorThemeClasses) {
        const { $colors, $typography, $fontSizes, $cacheKey, ...tokens } =
            lexicalTheme as InternalTheme;

        if (!$colors) {
            return Theme.lastUsedTheme ?? Theme.empty();
        }

        if (!Theme.cache[$cacheKey]) {
            Theme.cache[$cacheKey] = new Theme({
                colors: $colors,
                typography: $typography,
                fontSizes: $fontSizes,
                tokens
            });
        }

        Theme.lastUsedTheme = Theme.cache[$cacheKey];

        return Theme.cache[$cacheKey];
    }

    get colors() {
        return this._colors;
    }

    get typography() {
        return this._typography;
    }

    get fontSizes() {
        return this._fontSizes;
    }

    getTypographyById(id: string) {
        return this._typographyMap[id];
    }

    getTypographyByTag(tag: string | string[]) {
        const tags = Array.isArray(tag) ? tag : [tag];

        for (const styleId in this._typographyMap) {
            const style = this._typographyMap[styleId];
            if (tags.includes(style.tag)) {
                return style;
            }
        }
        return undefined;
    }

    /*
     *  Creates a map of style key ID's and typography style objects
     */
    private toTypographyMap(typography: EditorTheme["typography"]): TypographyMap {
        return Object.keys(typography).reduce((acc, key) => {
            const items = typography[key];
            for (const item of items) {
                acc[item.id] = item;
            }
            return acc;
        }, {} as TypographyMap);
    }
}
