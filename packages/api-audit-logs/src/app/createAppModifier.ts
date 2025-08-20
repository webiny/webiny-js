import type { CreateAcoAppModifierCallable } from "@webiny/api-aco";
import { createAcoAppModifier as baseCreateAppModifier } from "@webiny/api-aco";
import { AUDIT_LOGS_TYPE } from "./contants";
import type { Context } from "@webiny/handler/types";
import type { AuditLogsContext } from "~/types.js";

export const createAppModifier = <T extends Context = AuditLogsContext>(
    cb: CreateAcoAppModifierCallable<T>
) => {
    return baseCreateAppModifier<T>(AUDIT_LOGS_TYPE, cb);
};
