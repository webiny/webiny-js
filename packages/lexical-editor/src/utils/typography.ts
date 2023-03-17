import { TypographyValue } from "~/types";

export const hasTypographyStyles = (theme: Record<string, any>): boolean => {
    return !!theme?.styles?.typographyStyles;
};

export const getTypography = (
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
        const typographyTypeData = getTypography(typographyStyles, key);
        if (typographyTypeData) {
            return typographyTypeData.find(item => item.id === styleId);
        }
    }
    return undefined;
};
