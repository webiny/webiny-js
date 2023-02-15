import { ContextPlugin } from "@webiny/handler";
import get from "lodash/get";
import { PbAcoContext } from "~/types";

const supportedTypes = ["paragraph", "heading", "quote", "list"];

export const paragraphProcessor = () => {
    return new ContextPlugin<PbAcoContext>(context => {
        context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
            if (!supportedTypes.includes(element.type)) {
                return;
            }

            const value = get(element, "data.text.data.text");
            const regex = /(<([^>]+)>)/gi;

            return value.replace(regex, "").trim();
        });
    });
};
