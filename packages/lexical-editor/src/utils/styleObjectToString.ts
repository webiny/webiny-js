/*
 * Converts CSS style objects to string
 * Example:
 *  { fontSize: '10px' } => "font-size: 10px"
 * */
export const styleObjectToString = (styleObject: Record<string, any>): string => {
    if (!styleObject) {
        return styleObject;
    }
    return Object.keys(styleObject).reduce(
        (acc, key) =>
            acc +
            key
                .split(/(?=[A-Z])/)
                .join("-")
                .toLowerCase() +
            ":" +
            styleObject[key] +
            ";",
        ""
    );
};
