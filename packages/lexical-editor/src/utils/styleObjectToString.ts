// @ts-ignore
import reactToCSS from "react-style-object-to-css";

/*
 * Converts CSS style objects to string
 * Example:
 *  { fontSize: '10px' } => "font-size: 10px"
 * */
export const styleObjectToString = (styleObject: Record<string, any>): string => {
    if (!styleObject) {
        return styleObject;
    }
    return reactToCSS(styleObject);
};
