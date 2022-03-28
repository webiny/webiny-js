import { get } from "https";
import { load } from "cheerio";
import { defineLambdaEdgeRequestHandler, CloudFrontResponse } from "~/lambdaEdge";

import { pointsToFile, variantCookie, variantHeader } from "../utils/common";
import { isConfigRequest, loadConfig } from "../utils/config";
import {
    getHeader,
    redirectResponse,
    setResponseCookie,
    getRequestCookies
} from "../utils/headers";
import { isHeaderBlacklisted } from "../utils/headerBlacklist";
import { setDomainOrigin } from "../utils/origin";

export const pageOriginRequest = defineLambdaEdgeRequestHandler(async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;

    if (isConfigRequest(request)) {
        // requesting the config file, pass it through
        return request;
    }

    let stageName = getHeader(request.headers, variantHeader);
    let stageFromCookie = false;

    if (!stageName) {
        stageName = getRequestCookies(request)[variantCookie];
        stageFromCookie = true;
    }

    if (!stageName) {
        // Stage is not set, just let it pass.
        return request;
    }

    const config = await loadConfig(event);
    const stageConfig = config[stageName];
    if (!stageConfig) {
        if (stageFromCookie) {
            // If stage is invalid, we should make a redirect,
            // clearing out any sticky cookie user may have.
            const response = redirectResponse({
                url: request.uri,
                query: request.querystring
            });

            setResponseCookie(response, `${variantCookie}=; Secure; Path=/;`);
            return response;
        } else {
            // Do not make a redirect for stage selected with header,
            // because this will lead to infinite redirects.
            return {
                status: "404",
                body: `No stage ${stageName} found`
            };
        }
    }

    console.log(`Forwarding to ${stageConfig.domain}`);

    if (pointsToFile(request.uri)) {
        setDomainOrigin(request, stageConfig.domain);
        return request;
    }

    const response = await getOriginPage(stageConfig.domain, request.uri);
    setResponseCookie(response, `${variantCookie}=${stageName}; Secure; Path=/;`);
    return response;
});

function getOriginPage(domain: string, path: string) {
    return new Promise<CloudFrontResponse>((resolve, reject) => {
        let responseBody = "";
        const req = get(
            {
                hostname: domain,
                port: 443,
                path: path
            },
            res => {
                res.on("data", chunk => (responseBody += chunk));
                res.on("end", () => {
                    const doc = load(responseBody);
                    const host = `https://${domain}`;

                    doc("head > link").each((_i, el) => {
                        const href = el.attribs["href"];
                        if (href && href.startsWith("/")) {
                            el.attribs["href"] = host + href;
                        }
                    });

                    doc("script").each((_i, el) => {
                        const src = el.attribs["src"];
                        if (src && src.startsWith("/")) {
                            el.attribs["src"] = host + src;
                        }
                    });

                    const response: CloudFrontResponse & { body: string } = {
                        body: doc.html(),
                        status: "200",
                        statusDescription: "ok",
                        headers: {}
                    };

                    for (const header of Object.keys(res.headers)) {
                        if (isHeaderBlacklisted(header)) {
                            continue;
                        }

                        const value = res.headers[header];
                        if (Array.isArray(value)) {
                            response.headers[header] = value.map(h => ({
                                key: header,
                                value: h
                            }));
                        } else if (value) {
                            response.headers[header] = [
                                {
                                    key: header,
                                    value: value
                                }
                            ];
                        }
                    }

                    resolve(response);
                });
            }
        );

        req.on("error", e => {
            reject({
                statusCode: 500,
                body: e.message.substring(0, 100)
            });
        });
    });
}
