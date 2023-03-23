import { TypographyValue } from "~/types";

export const hasTypographyStyles = (theme: Record<string, any>): boolean => {
    return !!theme?.styles?.typographyStyles;
};

/**
 * @desc Take all styles from provided type, like headings, list, quotes...
 * @param typographyStyles
 * @param typographyStyleType
 */
export const getTypographyStylesByType = (
    typographyStyles: Record<string, TypographyValue[]>,
    typographyStyleType: string
): TypographyValue[] | null => {
    return typographyStyles[typographyStyleType] ?? null;
};

export const findTypographyStyleById = (
    theme: Record<string, any>,
    styleId: string
): TypographyValue | undefined => {
    if (!hasTypographyStyles(theme)) {
        return undefined;
    }
    const typographyStyles = theme?.styles?.typographyStyles;
    for (const key in typographyStyles) {
        const typographyTypeData = getTypographyStylesByType(typographyStyles, key);
        if (typographyTypeData) {
            const style = typographyTypeData.find(item => item.id === styleId);
            if (style) {
                return style;
            }
        }
    }
    return undefined;
};
