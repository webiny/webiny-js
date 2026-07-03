import { TestHttpEventHandler } from "@webiny/event-handler-core/features/testing";
import { HeadlessCmsEndpointConfig } from "~/HeadlessCmsEndpointConfig.js";
import type { IHeadlessCmsEndpointConfig } from "~/HeadlessCmsEndpointConfig.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

class CmsEndpointAccessDecoratorImpl implements TestHttpEventHandler.Interface {
    constructor(
        private identityCtx: IIdentityContext,
        private cmsConfig: IHeadlessCmsEndpointConfig,
        private inner: TestHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        const { type } = this.cmsConfig;
        const permission = await this.identityCtx.getPermission(`cms.endpoint.${type}`);
        if (!permission) {
            return {
                statusCode: 401,
                body: {
                    data: null,
                    error: {
                        message: `Not allowed to access "${type}" endpoint.`,
                        code: "NOT_AUTHORIZED",
                        data: null,
                        stack: null
                    }
                }
            };
        }
        return this.inner.execute(ctx, next);
    }
}

export const CmsEndpointAccessDecorator = TestHttpEventHandler.createDecorator({
    decorator: CmsEndpointAccessDecoratorImpl,
    dependencies: [IdentityContext, HeadlessCmsEndpointConfig]
});
