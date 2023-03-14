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
        // Remove any HTML tag
        const regex = /(<([^>]+)>)/gi;

        return text.replace(regex, "").trim();
    });
};
