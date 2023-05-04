import { ThemeEmotionMap, ThemeEmotionStyle } from "~/types";

export const findTypographyStyleByHtmlTag = (
    htmlTag: string,
    themeEmotionMap: ThemeEmotionMap
): ThemeEmotionStyle | undefined => {
    for (const key in themeEmotionMap) {
        const style = themeEmotionMap[key];
        if (style.tag === htmlTag) {
            return style;
        }
    }
    return undefined;
};
