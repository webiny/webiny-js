import { ElementStylesHandler } from "~/types";

const text: ElementStylesHandler = ({ element, displayModeName }) => {
    const { text } = element.data;
    // Here we have data and display modes in the same object.
    if (!text || !text[displayModeName]) {
        return;
    }

    const values = text[displayModeName];
    console.log('vals', values)
    return {
        color: values.color,
        textAlign: values.alignment
    };
};

export const createText = () => text;
