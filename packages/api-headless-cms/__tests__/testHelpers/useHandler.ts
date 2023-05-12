import { createHandlerCore, CreateHandlerCoreParams } from "~tests/testHelpers/plugins";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { CmsContext } from "~/types";

interface CmsHandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

type Params = CreateHandlerCoreParams;
export const useHandler = (params: Params) => {
    const core = createHandlerCore(params);

    const plugins = [...core.plugins].concat([
        createRawEventHandler<CmsHandlerEvent, CmsContext, CmsContext>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<CmsHandlerEvent, CmsContext>({
        plugins,
        http: {
            debug: process.env.DEBUG === "true"
        }
    });
    return {
        plugins,
        tenant: core.tenant,
        handler: (payload: CmsHandlerEvent) => {
            return handler(payload, {} as any);
        }
    };
};
