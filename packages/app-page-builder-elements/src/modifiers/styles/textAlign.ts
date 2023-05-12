import { ElementStylesModifier } from "~/types";

const textAlign: ElementStylesModifier = ({ element }) => {
    const { horizontalAlign: textAlign } = element.data.settings || {};
    if (!textAlign) {
        return null;
    }

    // Backwards compatibility.
    // Older versions of Page Builder assigned both string and
    // object values to the `horizontalAlign` property.
    // Let's check which one is it and return styles accordingly.
    if (typeof textAlign === "string") {
        return { textAlign };
    }

    // If not string, then it's a `{ [breakpoint] : value }` object.
    return textAlign;
};

export const createTextAlign = () => textAlign;
