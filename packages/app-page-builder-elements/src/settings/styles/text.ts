import { ElementStylesHandler } from "~/types";

const text: ElementStylesHandler = ({ element, breakpointName }) => {
    const { text } = element.data;
    // Here we have data and display modes in the same object.
    if (!text || !text[breakpointName]) {
        return;
    }

    const values = text[breakpointName];
    return {
        color: values.color,
        textAlign: values.alignment
    };
};

export const createText = () => text;
