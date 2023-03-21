import React from "react";

export interface FontColorActionContext {
    /*
     * @desc Current selected color value
     * */
    value: string;

    /*
     * @desc Apply color to selected text.
     * @params: value
     */
    applyColor: (value: string, themeColorName: string | undefined) => void;
}

export const FontColorActionContext = React.createContext<FontColorActionContext | undefined>(
    undefined
);
