import { DecoratedTheme, Theme } from "~/types";

/*
 * By default function will return the CSSObject object.
 * To get full TypographyStyle object with all item props set includeAllItemProps to 'true'.
 * */
function byId(this: Array<any>, id: string, includeAllItemProps = false) {
    const typographyStyle = this.find((item: any) => item.id === id);
    if (includeAllItemProps) {
        return typographyStyle ?? undefined;
    }
    return typographyStyle?.css ?? undefined;
}

export const createTheme = (theme: Theme): DecoratedTheme => {
    const clonedTheme = { ...theme };
    const typography = clonedTheme.styles.typography;
    Object.keys(typography).forEach(key => {
        // @ts-ignore
        typography[key].byId = byId.bind(typography[key]);
    });
    return clonedTheme as DecoratedTheme;
};
