import React from "react";
import { TypographyValue } from "~/types";

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
