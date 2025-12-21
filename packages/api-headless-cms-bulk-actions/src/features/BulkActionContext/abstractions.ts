import { createAbstraction } from "@webiny/feature/api";
import type { HcmsBulkActionsContext } from "~/types.js";

// TODO: this is a bridge for legacy context; needs review and refactor of code that uses it.

export const BulkActionContext = createAbstraction<HcmsBulkActionsContext>("BulkActionContext");

export namespace BulkActionContext {
    export type Interface = HcmsBulkActionsContext;
}
