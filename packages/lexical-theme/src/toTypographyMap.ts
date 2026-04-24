import type { EditorTheme, TypographyMap } from "~/types.js";

export const toTypographyMap = (theme: EditorTheme): TypographyMap => {
    const typographyStyles = theme.typography;
    if (!typographyStyles) {
        return {};
    }

    return Object.keys(typographyStyles).reduce((acc, key) => {
        for (const style of typographyStyles[key]) {
            acc[style.id] = style;
        }
        return acc;
    }, {} as TypographyMap);
};
