import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { CreateHandlerCoreParams } from "./handlerCore";
import { createHandlerCore } from "./handlerCore";
import type { AuditLogsContext } from "~/types";
import type { LambdaContext } from "@webiny/handler-aws/types";

export const useHandler = (params?: CreateHandlerCoreParams) => {
    const core = createHandlerCore(params);

    const plugins: any[] = [...core.plugins].concat([
        createRawEventHandler<any, AuditLogsContext, AuditLogsContext>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<any, AuditLogsContext>({
        plugins,
        debug: process.env.DEBUG === "true"
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
                {} as LambdaContext
            );
        }
    };
};
