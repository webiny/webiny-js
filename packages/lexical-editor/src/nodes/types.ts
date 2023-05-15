export type ThemeTextColorType = "font-color" | "background-color" | string;
export type ThemeStyleType = "typography" | ThemeTextColorType;

export interface ThemeStyleValue {
    styleId: string;
    type: ThemeStyleType;
}

export interface TextNodeThemeStyles {
    getThemeStyles: () => ThemeStyleValue[];
    setThemeStyles: (styles: ThemeStyleValue[]) => void;
}

export interface TypographyStylesNode {
    setTypography: (typographyStyleId: string) => void;
    getTypographyStyleId: () => string | undefined;
    clearTypographyStyle: () => void;
    hasTypographyStyle: () => boolean;
}

export interface TextColorStylesNode {
    setColor: (colorId: string, colorType: ThemeTextColorType) => void;
    getColor(): ThemeStyleValue | undefined;
    // Returns HEX value
    getColorValue: () => string | undefined;
    clearColor: (type: ThemeTextColorType) => void;
    hasColor: (type: ThemeTextColorType) => boolean;
    getColorType: ThemeTextColorType | undefined;
}
