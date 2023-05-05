import { ThemeEmotionMap } from "~/types";

export const findTypographyStyleByHtmlTag = (htmlTag: string, themeEmotionMap: ThemeEmotionMap) => {
    for (const styleId in themeEmotionMap) {
        const style = themeEmotionMap[styleId];
        if (style.tag === htmlTag) {
            return style;
        }
    }
    return undefined;
};
