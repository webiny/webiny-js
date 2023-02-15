import { ContextPlugin } from "@webiny/handler";
import get from "lodash/get";
import { PbAcoContext } from "~/types";

export const imagesProcessor = () => {
    return new ContextPlugin<PbAcoContext>(context => {
        context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
            if (element.type !== "images-list") {
                return;
            }
            return get(element, "data.images");
        });
    });
};
