import { ContextPlugin } from "@webiny/handler";
import set from "lodash/set";
import { PbContext } from "~/graphql/types";
import { useElementVariables } from "./useElementVariables";

export default new ContextPlugin<PbContext>(context => {
    context.pageBuilder.addPageElementProcessor(({ block, element }) => {
        if (element.type !== "icon") {
            return;
        }

        const variables = useElementVariables(block, element);
        const value = variables?.length > 0 ? variables[0].value : null;

        if (value !== null) {
            set(element, "data.icon.value", value);
        }
    });
});
