import type { CreateHandlerCoreParams } from "~tests/testHelpers/plugins";
import { createHandlerCore } from "~tests/testHelpers/plugins";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { CmsContext } from "~/types";
import { defaultIdentity } from "~tests/testHelpers/tenancySecurity";
import type { LambdaContext } from "@webiny/handler-aws/types";

export interface CmsHandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

export type UseHandlerParams = CreateHandlerCoreParams;
export const useHandler = (params: UseHandlerParams) => {
    const core = createHandlerCore(params);

    const plugins = [...core.plugins].concat([
        createRawEventHandler<CmsHandlerEvent, CmsContext, CmsContext>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<CmsHandlerEvent, CmsContext>({
        plugins,
        debug: process.env.DEBUG === "true"
    });
    return {
        plugins,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        handler: (payload: CmsHandlerEvent) => {
            return handler(payload, {} as LambdaContext);
        }
    };
};
