import { AcoContext, IAcoApp } from "@webiny/api-aco/types";
import { Context as BaseContext } from "@webiny/handler/types";

export interface AuditLogsAcoContext extends BaseContext, AcoContext {
    auditLogsAco: {
        app: IAcoApp;
    };
}
