import get from "lodash/get";
import { PbAcoContext } from "~/types";

const supportedTypes = ["paragraph", "heading", "quote", "list"];

export const paragraphProcessor = (context: PbAcoContext) => {
    context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
        if (!supportedTypes.includes(element.type)) {
            return "";
        }

        const value = get(element, "data.text.data.text");
        // Remove any HTML tag
        const regex = /(<([^>]+)>)/gi;

        return value.replace(regex, "").trim();
    });
};
