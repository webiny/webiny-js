// @ts-expect-error - There are no types "@types/react-style-object-to-css" for this lib.
import reactToCSS from "react-style-object-to-css";
import type { CSSObject } from "@emotion/react";

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
