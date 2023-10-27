import {
    createAcoAppModifier as baseCreateAppModifier,
    CreateAcoAppModifierCallable
} from "@webiny/api-aco";
import { AUDIT_LOGS_TYPE } from "./contants";
import { AuditLogsAcoContext } from "./types";
import { Context } from "@webiny/handler/types";

export const createAppModifier = <T extends Context = AuditLogsAcoContext>(
    cb: CreateAcoAppModifierCallable<T>
) => {
    return baseCreateAppModifier<T>(AUDIT_LOGS_TYPE, cb);
};
