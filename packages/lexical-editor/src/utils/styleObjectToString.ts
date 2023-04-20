// @ts-ignore
import reactToCSS from "react-style-object-to-css";
import { CSSObject } from "@emotion/react";

/*
 * Converts CSS style objects to string
 * Example:
 *  { fontSize: '10px' } => "font-size: 10px"
 * */
export const styleObjectToString = (styleObject: CSSObject): string => {
    if (!styleObject) {
        return styleObject;
    }
    return reactToCSS(styleObject);
};
