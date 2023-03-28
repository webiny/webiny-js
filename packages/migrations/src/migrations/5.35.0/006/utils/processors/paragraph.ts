import get from "lodash/get";

import { getLexicalContentText } from "../getLexicalContentText";

const supportedTypes = ["paragraph", "heading", "quote", "list"];

export const paragraphProcessor = (element: any) => {
    if (!supportedTypes.includes(element.type)) {
        return "";
    }

    const value = get(element, "data.text.data.text");
    // Get text from Lexical Editor JSON string.
    const text = getLexicalContentText(value);
    // Remove any HTML tag
    const regex = /(<([^>]+)>)/gi;

    return text.replace(regex, "").trim();
};
