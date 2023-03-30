import { ThemeEmotionMap, TypographyHTMLTag } from "~/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";

export const toThemeEmotionMap = (
    css: (cssStyle: Record<string, any>) => string,
    theme: WebinyTheme
): ThemeEmotionMap | {} => {
    const map: ThemeEmotionMap = {};
    const typographyStyles = theme?.styles?.typographyStyles;
    if (!typographyStyles) {
        return {};
    }

    for (const key in typographyStyles) {
        const typographyTypeData = typographyStyles[key] as {
            id: string;
            tag: TypographyHTMLTag;
            name: string;
            css: Record<string, any>;
        }[];
        if (typographyTypeData) {
            typographyTypeData.forEach(styleItem => {
                // 'le' is for shorter url generation
                const le = {
                    ...styleItem,
                    className: [css(styleItem.css)].filter(Boolean).join(" ")
                };
                map[styleItem.id] = le;
            });
        }
    }

    return map;
};
