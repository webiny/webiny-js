import React from "react";
import type { TypographyValue } from "@webiny/lexical-theme";

export type ActiveTypography = Pick<TypographyValue, "id" | "label">;

export interface TypographyActionContextProps {
    /*
     * @desc Current selected typography
     * */
    value: ActiveTypography | undefined;

    /*
     * @desc Apply font family to selected text.
     * @params: value
     */
    applyTypography: (value: TypographyValue) => void;
}

export const TypographyActionContext = React.createContext<
    TypographyActionContextProps | undefined
>(undefined);
