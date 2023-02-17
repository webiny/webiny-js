import get from "lodash/get";
import { PbAcoContext } from "~/types";

export const buttonProcessor = (context: PbAcoContext) => {
    context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
        if (element.type !== "button") {
            return "";
        }
        return get(element, "data.buttonText");
    });
};
