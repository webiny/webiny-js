export type ThemeStyleType = "typography" | "colors" | "fonts";

export interface ThemeStyleValue {
    styleId: string;
    type: ThemeStyleType;
}

/*
 * Indicates that the node is implementing the typography styles
 */
export interface TypographyStylesNode {
    setTypography: (typographyStyleId: string) => void;
    getTypographyStyleId: () => string | undefined;
    clearTypographyStyle: () => void;
    hasTypographyStyle: () => boolean;
}

/*
 * Indicates that the node implements webiny theme styles.
 */
export interface TextNodeThemeStyles {
    getThemeStyles: () => ThemeStyleValue[];
    setThemeStyles: (styles: ThemeStyleValue[]) => void;
}
