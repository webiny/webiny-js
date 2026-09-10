import { createAbstraction } from "@webiny/feature/api";

interface IBulkActionsInternalToken {
    value: string;
}

export const BulkActionsInternalToken = createAbstraction<IBulkActionsInternalToken>(
    "BulkActionsInternalToken"
);

export namespace BulkActionsInternalToken {
    export type Interface = IBulkActionsInternalToken;
}
