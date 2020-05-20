import { ContextPlugin } from "@webiny/graphql/types";
import { DataManagerClient } from "./DataManagerClient";

interface Params {
    dataManagerFunction: string;
}

export default ({ dataManagerFunction }: Params): ContextPlugin => {
    return {
        type: "context",
        name: "context-cms-data-manager",
        apply(context) {
            context.cms = context.cms || {};
            context.cms.dataManager = new DataManagerClient({ dataManagerFunction, context });
        }
    };
};
