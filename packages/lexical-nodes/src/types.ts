export type ThemeStyleType = "typography" | "colors" | "fonts";

export interface ThemeStyleValue {
    styleId: string;
    type: ThemeStyleType;
}

export interface TextNodeThemeStyles {
    getThemeStyles: () => ThemeStyleValue[];
    setThemeStyles: (styles: ThemeStyleValue[]) => void;
}

/*
 * Indicates that the node is implementing the typography styles
 */
export interface TypographyStylesNode {
    getTypographyStyleId: () => string | undefined;
}
