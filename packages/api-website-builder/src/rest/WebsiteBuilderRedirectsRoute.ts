import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IIdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import type { GetActiveRedirectsUseCase as IGetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/abstractions.js";
import { ActiveRedirectRestMapper } from "./ActiveRedirectRestMapper.js";

class WebsiteBuilderRedirectsRouteImpl {
    readonly method = "GET";
    readonly path = "/wb/redirects";

    constructor(
        private identityCtx: IIdentityContext,
        private getActiveRedirects: IGetActiveRedirectsUseCase.Interface
    ) {}

    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        const identity = this.identityCtx.getIdentity();
        if (identity.isAnonymous()) {
            return {
                statusCode: 401,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ message: "Not authorized." })
            };
        }

        const result = await this.getActiveRedirects.execute();
        const redirectsDto = result.value.map(entry => ActiveRedirectRestMapper.toDto(entry));

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
                "cache-control": "public, max-age=31536000"
            },
            body: JSON.stringify(redirectsDto)
        };
    }
}

export const WebsiteBuilderRedirectsRoute = HttpRoute.createImplementation({
    implementation: WebsiteBuilderRedirectsRouteImpl,
    dependencies: [IdentityContext, GetActiveRedirectsUseCase]
});
