import React from "react";

export type TypographyValue = {
    // CSSObject type
    styleObject: Record<string, any>;
    // variable name defined in the theme
    themeTypographyName: string;
    // Show on UI
    displayName: string;
};

export interface TypographyActionContextProps {
    /*
     * @desc Current selected typography
     * */
    value: TypographyValue | undefined;

    /*
     * @desc Apply font family to selected text.
     * @params: value
     */
    applyTypography: (value: TypographyValue) => void;
}

export const TypographyActionContext = React.createContext<
    TypographyActionContextProps | undefined
>(undefined);
