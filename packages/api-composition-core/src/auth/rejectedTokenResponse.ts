import type { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { corsHeaders } from "@webiny/api-kernel-core";
import { codedErrorBody } from "@webiny/api-kernel-core";
import type { IHttpResponse } from "@webiny/api-kernel-core";
import { getHeader } from "./getHeader.js";

/**
 * The answer to a request whose token an identity provider rejected, for example in
 * `verifyTokenClaims`. Every transport's identity loader returns it, so a rejected token gets the same
 * 401 on AWS and on standalone.
 *
 * The identity loaders run before the router, so `SecureHeadersDecorator` never sees this response and
 * the CORS headers are added here. Without them the browser reports a CORS failure instead of the 401.
 */
export function rejectedTokenResponse(
    error: AuthenticationError,
    headers: Record<string, string> | undefined
): IHttpResponse {
    const origin = getHeader(headers, "origin");
    const cors = corsHeaders(origin);
    const body = codedErrorBody(error);

    return {
        statusCode: 401,
        headers: {
            ...cors,
            "content-type": "application/json",
            "www-authenticate": 'Bearer error="invalid_token"'
        },
        body
    };
}
