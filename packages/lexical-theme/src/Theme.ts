import type { EditorThemeClasses } from "lexical";
import type { ColorValue, EditorTheme, TypographyMap, TypographyValue } from "~/types.js";

type InternalProps = {
    $colors: EditorTheme["colors"];
    $typography: EditorTheme["typography"];
    $cacheKey: string;
};

type InternalTheme = EditorThemeClasses & InternalProps;

export class Theme {
    static cache: Record<string, Theme> = {};
    static lastUsedTheme: Theme | null = null;
    public readonly tokens: EditorThemeClasses;
    private _colors: ColorValue[];
    private _typography: Record<string, TypographyValue[]>;
    private _typographyMap: TypographyMap;

    constructor(
        colors: EditorTheme["colors"],
        typography: EditorTheme["typography"],
        tokens: EditorThemeClasses
    ) {
        this._colors = colors;
        this._typography = typography;
        this._typographyMap = this.toTypographyMap(typography);
        this.tokens = tokens;
    }

    static empty() {
        return new Theme([], {}, {});
    }

    static from(lexicalTheme: EditorThemeClasses) {
        const { $colors, $typography, $cacheKey, ...tokens } = lexicalTheme as InternalTheme;

        if (!$colors) {
            return Theme.lastUsedTheme ?? Theme.empty();
        }

        if (!Theme.cache[$cacheKey]) {
            Theme.cache[$cacheKey] = new Theme($colors, $typography, tokens);
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
