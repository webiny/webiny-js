export type ThemeStyleType = "typography" | "colors" | "fonts";

export type ThemeStyleValue = {
    styleId: string;
    type: ThemeStyleType;
};

export interface TypographyStylesNode {
    setTypography: (typographyStyleId: string) => void;
    getTypographyStyle: () => string | undefined;
    clearTypographyStyle: () => void;
}

export interface TextNodeThemeStyles {
    /*
     * Clear all theme styles
     */
    getThemeStyle: () => ThemeStyleValue;

    /*
     * Get all styles
     */
    setThemeStyle: (style: ThemeStyleValue) => TextThemeStyle[];
}

export type TextThemeStyle = {
    styleId: string;
};

/*
 * Indicates that the lexical node works with the Webiny theme styles
 */
export interface TextNodeThemeStyles {
    /*
     * Clear all theme styles
     */
    clearStyles: () => void;

    /*
     * Get all styles
     */
    getStyles: () => TextThemeStyle[];
}

export interface NodeFontColorStyles extends TextNodeThemeStyles {
    setThemeColor: (styleId: string) => void;

    setCustomColor: (hexValue: string) => void;

    /*
     * Removes custom or theme style color from the node.
     */
    removeColor: () => void;

    /*
     * Get color as HEX value, additionally if font color is set from the theme styles then will return the styleId as well.
     */
    getFontColor: () => ThemeStyleValue | undefined;
}
