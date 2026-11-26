import type { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { codedErrorBody } from "@webiny/api-kernel-core";
import type { IHttpResponse } from "@webiny/api-kernel-core";

/**
 * The answer to a request whose token an identity provider rejected, for example in
 * `verifyTokenClaims`. The body carries the error's `Authentication/...` code, which the Admin reads
 * to recognise a bad login. `CorsHeadersDecorator` adds the CORS headers on the way out.
 */
export function rejectedTokenResponse(error: AuthenticationError): IHttpResponse {
    const body = codedErrorBody(error);

    return {
        statusCode: 401,
        headers: {
            "content-type": "application/json",
            "www-authenticate": 'Bearer error="invalid_token"'
        },
        body
    };
}
