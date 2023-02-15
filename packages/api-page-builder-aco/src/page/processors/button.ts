import { ContextPlugin } from "@webiny/handler";
import get from "lodash/get";
import { PbAcoContext } from "~/types";

export const buttonProcessor = () => {
    return new ContextPlugin<PbAcoContext>(context => {
        context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
            if (element.type !== "button") {
                return;
            }
            return get(element, "data.buttonText");
        });
    });
};
