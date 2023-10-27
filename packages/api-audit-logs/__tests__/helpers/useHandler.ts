import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { createHandlerCore, CreateHandlerCoreParams } from "./handlerCore";
import { AuditLogsContext, AuditLogsAcoContext } from "~/types";

export const useHandler = (params?: CreateHandlerCoreParams) => {
    const core = createHandlerCore(params);

    const plugins: any[] = [...core.plugins].concat([
        createRawEventHandler<any, AuditLogsContext, AuditLogsContext>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<any, AuditLogsContext & AuditLogsAcoContext>({
        plugins,
        http: {
            debug: process.env.DEBUG === "true"
        }
    });
    return {
        plugins,
        tenant: core.tenant,
        handler: (payload: Record<string, any> = {}) => {
            return handler(
                {
                    ...payload,
                    headers: {
                        ["x-tenant"]: "root",
                        ...payload?.headers
                    }
                },
                {} as any
            );
        }
    };
};
