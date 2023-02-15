import { ContextPlugin } from "@webiny/handler";
import get from "lodash/get";
import { PbAcoContext } from "~/types";

export const imageProcessor = () => {
    return new ContextPlugin<PbAcoContext>(context => {
        context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
            if (element.type !== "image") {
                return;
            }
            return get(element, "data.image.title");
        });
    });
};
