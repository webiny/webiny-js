import React from "react";

export interface FontColorActionContext {
    /*
     * @desc Current selected color value
     * */
    value: string;

    /*
     * @desc True when the selected text has no font color of its own: `value` is then the
     * "#000" fallback, not a color the text has.
     */
    isDefault?: boolean;

    /*
     * @desc Apply color to selected text.
     * @params: value
     */
    applyColor: (value: string, themeColorName: string | undefined) => void;
}

export const FontColorActionContext = React.createContext<FontColorActionContext | undefined>(
    undefined
);
