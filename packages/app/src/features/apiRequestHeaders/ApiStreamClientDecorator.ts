import { ApiStreamClient } from "~/features/apiStreamClient/abstractions.js";
import { ApiRequestHeadersResolver } from "./abstractions.js";
import { withProviderHeaders } from "./mergeHeaders.js";

class ApiStreamClientWithApiRequestHeaders implements ApiStreamClient.Interface {
    constructor(
        private resolver: ApiRequestHeadersResolver.Interface,
        private decoratee: ApiStreamClient.Interface
    ) {}

    async execute(params: ApiStreamClient.Request): Promise<ApiStreamClient.Response> {
        const headers = await this.resolver.resolve();
        return this.decoratee.execute({
            ...params,
            headers: withProviderHeaders(headers, params.headers)
        });
    }
}

export const ApiStreamClientDecorator = ApiStreamClient.createDecorator({
    decorator: ApiStreamClientWithApiRequestHeaders,
    dependencies: [ApiRequestHeadersResolver]
});
