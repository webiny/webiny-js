import get from "lodash/get";

import { getLexicalContentText } from "../getLexicalContentText";

const supportedTypes = ["paragraph", "heading", "quote", "list"];

export const paragraphProcessor = (element: Record<string, any>) => {
    if (!supportedTypes.includes(element.type)) {
        return "";
    }

    const value = get(element, "data.text.data.text");
    // Get text from Lexical Editor JSON string.
    const text = getLexicalContentText(value);

    return text
        .replace(/(<([^>]+)>)/gi, "") // Remove any HTML tag
        .replace(/(\n)|(\r)|(\r\n)/gi, "") // Remove any new line char
        .replace(/([ ]{2,})/gi, " ") // Replace multiple spaces with one space only
        .trim();
};
