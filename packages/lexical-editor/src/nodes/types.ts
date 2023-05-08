export type ThemeStyleType = "typography" | "colors" | "fonts";

export interface ThemeStyleValue {
    styleId: string;
    type: ThemeStyleType;
}

export interface TypographyStylesNode {
    setTypography: (typographyStyleId: string) => void;
    getTypographyStyleId: () => string | undefined;
    clearTypographyStyle: () => void;
    hasTypographyStyle: () => boolean;
}

export interface TextNodeThemeStyles {
    /*
     * Clear all theme styles
     */
    getThemeStyles: () => ThemeStyleValue[];
}
