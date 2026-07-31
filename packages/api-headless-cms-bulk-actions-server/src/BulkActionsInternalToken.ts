import { Abstraction } from "@webiny/di";

interface IBulkActionsInternalToken {
    value: string;
}

export const BulkActionsInternalToken = new Abstraction<IBulkActionsInternalToken>(
    "BulkActionsInternalToken"
);

export namespace BulkActionsInternalToken {
    export type Interface = IBulkActionsInternalToken;
}
