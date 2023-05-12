import { ContextPlugin } from "@webiny/handler";
import set from "lodash/set";
import { PbContext } from "~/graphql/types";
import { useElementVariables } from "./useElementVariables";

export default new ContextPlugin<PbContext>(context => {
    context.pageBuilder.addPageElementProcessor(({ block, element }) => {
        if (element.type !== "button") {
            return;
        }

        const variables = useElementVariables(block, element);

        const label = variables?.find(variable => variable.id.endsWith(".label"))?.value || null;
        const url = variables?.find(variable => variable.id.endsWith(".url"))?.value || null;

        if (label) {
            set(element, "data.buttonText", label);
        }

        if (url) {
            set(element, "data.action.href", url);
        }
    });
});
