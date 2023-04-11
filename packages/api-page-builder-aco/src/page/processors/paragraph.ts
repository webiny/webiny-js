import get from "lodash/get";

import { getLexicalContentText } from "~/utils/getLexicalContentText";

import { PbAcoContext } from "~/types";

const supportedTypes = ["paragraph", "heading", "quote", "list"];

export const paragraphProcessor = (context: PbAcoContext) => {
    context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
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
    });
};
