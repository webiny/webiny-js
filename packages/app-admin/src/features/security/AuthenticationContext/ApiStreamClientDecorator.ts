import { ApiStreamClient } from "@webiny/app/features/apiStreamClient/index.js";
import { InternalIdTokenProvider } from "~/features/security/AuthenticationContext/abstractions.js";

export const WEBINY_AUTHORIZATION_HEADER = "x-webiny-authorization";

/**
 * Attaches the admin id token to streaming API requests. Mirrors `GraphQLClientDecorator` — the two
 * clients are separate abstractions, so neither decorator covers the other.
 *
 * Uses `x-webiny-authorization` rather than `Authorization`, because on AWS the streaming route is
 * served by a Lambda Function URL behind CloudFront with Origin Access Control: OAC signs the request
 * with SigV4, which occupies the `Authorization` header, so a bearer token there would not survive to
 * the origin. Both the AWS and the self-hosted identity extractors read this header first.
 */
class ApiStreamClientWithIdToken implements ApiStreamClient.Interface {
    constructor(
        private idTokenProvider: InternalIdTokenProvider.Interface,
        private decoratee: ApiStreamClient.Interface
    ) {}

    async execute(params: ApiStreamClient.Request): Promise<Response> {
        if (params.headers?.[WEBINY_AUTHORIZATION_HEADER]) {
            return this.decoratee.execute(params);
        }

        const idToken = await this.idTokenProvider.getTokenProvider()();

        const authHeaders = idToken ? { [WEBINY_AUTHORIZATION_HEADER]: `Bearer ${idToken}` } : {};

        return this.decoratee.execute({
            ...params,
            headers: { ...params.headers, ...authHeaders }
        });
    }
}

export const ApiStreamClientDecorator = ApiStreamClient.createDecorator({
    decorator: ApiStreamClientWithIdToken,
    dependencies: [InternalIdTokenProvider]
});
