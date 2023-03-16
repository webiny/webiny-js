import get from "lodash/get";
import { PbAcoContext } from "~/types";

export const imageProcessor = (context: PbAcoContext) => {
    context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
        if (element.type !== "image") {
            return "";
        }
        return get(element, "data.image.title");
    });
};
