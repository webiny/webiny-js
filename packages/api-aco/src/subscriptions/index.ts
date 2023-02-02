import { ContextPlugin } from "@webiny/api";
import { afterPageCreate } from "~/subscriptions/aftePageCreate";
import { afterFolderDelete } from "~/subscriptions/afterFolderDelete";
import { ACOContext } from "~/types";

export const graphQLSubscriptions = (): ContextPlugin<ACOContext>[] => {
    return [afterFolderDelete(), afterPageCreate()];
};

export const importExportSubscriptions = (): ContextPlugin<ACOContext>[] => {
    return [afterPageCreate()];
};
