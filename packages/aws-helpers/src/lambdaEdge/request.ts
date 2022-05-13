import { setHeader } from "./headers";
import { CloudFrontRequest } from "./types";

export function setDomainOrigin(request: CloudFrontRequest, domain: string) {
    request.origin = {
        custom: {
            domainName: domain,
            port: 443,
            protocol: "https",
            path: "",
            sslProtocols: ["TLSv1", "TLSv1.1", "TLSv1.2"],
            readTimeout: 5,
            keepaliveTimeout: 5,
            customHeaders: {}
        }
    };

    setHeader(request.headers, {
        key: "host",
        value: domain
    });
}
