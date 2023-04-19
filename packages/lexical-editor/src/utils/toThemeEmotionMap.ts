import { ThemeEmotionMap, TypographyHTMLTag } from "~/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";

export const toThemeEmotionMap = (
    css: (cssStyle: Record<string, any>) => string,
    theme: WebinyTheme
): ThemeEmotionMap | {} => {
    const map: ThemeEmotionMap = {};
    const typographyStyles = theme?.styles?.typography;
    if (!typographyStyles) {
        return {};
    }

    for (const key in typographyStyles) {
        const typographyTypeData = typographyStyles[key] as {
            id: string;
            tag: TypographyHTMLTag;
            name: string;
            styles: Record<string, any>;
        }[];
        if (typographyTypeData) {
            typographyTypeData.forEach(styleItem => {
                // 'le' is for shorter url generation
                const le = {
                    ...styleItem,
                    className: [css(styleItem.styles)].filter(Boolean).join(" ")
                };
                map[styleItem.id] = le;
            });
        }
    }

    return map;
};
