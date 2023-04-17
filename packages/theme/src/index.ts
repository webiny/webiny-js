import { DecoratedTheme, Theme, ThemeTypographyHTMLTag, TypographyStyle } from "~/types";
import { CSSObject } from "@emotion/react";

/*
 * By default function will return the CSSObject object.
 * To get full TypographyStyle object with all item props set includeAllItemProps to 'true'.
 * */
function cssById(this: Array<any>, id: string): CSSObject | undefined {
    const typographyStyle = this.find((item: any) => item.id === id);
    return typographyStyle?.css ?? undefined;
}

/*
 * By default function will return the CSSObject object.
 * To get full TypographyStyle object with all item props set includeAllItemProps to 'true'.
 * */
function byId(this: Array<any>, id: string): TypographyStyle<ThemeTypographyHTMLTag> | undefined {
    return this.find((item: any) => item.id === id);
}

export const createTheme = (theme: Theme): DecoratedTheme => {
    const clonedTheme = { ...theme };
    const typography = clonedTheme.styles.typography;
    Object.keys(typography).forEach(key => {
        // @ts-ignore
        typography[key].cssById = cssById.bind(typography[key]);
        // @ts-ignore
        typography[key].byId = byId.bind(typography[key]);
    });
    return clonedTheme as DecoratedTheme;
};
