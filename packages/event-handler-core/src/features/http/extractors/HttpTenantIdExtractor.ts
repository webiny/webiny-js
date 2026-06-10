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
        const header = request.headers["x-tenant"] || request.headers["X-Tenant"];
        if (header) {
            return header;
        }

        const host = request.headers["host"] || request.headers["Host"] || "";
        const parts = host.split(".");
        if (parts.length >= 3) {
            const subdomain = parts[0];
            if (subdomain && subdomain !== "www" && subdomain !== "api") {
                return subdomain;
            }
        }

        return undefined;
    }
}

export const HttpTenantIdExtractorImpl = HttpTenantIdExtractor.createImplementation({
    implementation: DefaultHttpTenantIdExtractor,
    dependencies: []
});
