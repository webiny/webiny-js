import { Abstraction } from "@webiny/di";
import type { IHttpRequest } from "~/features/http/abstractions.js";

export interface IHttpTenantIdExtractor {
    extract(request: IHttpRequest): string | undefined;
}

export const HttpTenantIdExtractor = new Abstraction<IHttpTenantIdExtractor>(
    "HttpTenantIdExtractor"
);

export namespace HttpTenantIdExtractor {
    export type Interface = IHttpTenantIdExtractor;
}

class DefaultHttpTenantIdExtractor implements IHttpTenantIdExtractor {
    extract(request: IHttpRequest): string | undefined {
        return request.headers["x-tenant"] || request.headers["X-Tenant"];
    }
}

export const HttpTenantIdExtractorImpl = HttpTenantIdExtractor.createImplementation({
    implementation: DefaultHttpTenantIdExtractor,
    dependencies: []
});
