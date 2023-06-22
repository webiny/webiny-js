import React from "react";
import { ElementFormatType } from "lexical";

export interface TextAlignmentActionContextProps {
    /*
     * Selected text alignment value
     * */
    value: ElementFormatType;

    /*
     * Apply text alignment to selected text
     */
    applyTextAlignment: (value: ElementFormatType) => void;

    outdentText: () => void;

    indentText: () => void;
}

export const TextAlignmentActionContext = React.createContext<
    TextAlignmentActionContextProps | undefined
>(undefined);
