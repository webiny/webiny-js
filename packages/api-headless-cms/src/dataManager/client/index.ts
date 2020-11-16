import { DataManagerClient } from "./DataManagerClient";
import { ContextPlugin } from "@webiny/handler/types";

interface Params {
    dataManagerFunction: string;
}

export default ({ dataManagerFunction }: Params): ContextPlugin => {
    return {
        type: "context",
        name: "context-cms-data-manager",
        apply(context) {
            if (!context.cms) {
                context.cms = {};
            }

            context.cms.dataManager = new DataManagerClient({ dataManagerFunction, context });
        }
    };
};
