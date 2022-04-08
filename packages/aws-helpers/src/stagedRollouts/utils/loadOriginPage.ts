import { CloudFrontResponse } from "aws-lambda";
import { get } from "https";
import { load, Element } from "cheerio";
import { isHeaderBlacklisted } from "./headerBlacklist";
import { logDebug } from "./log";

export function loadOriginPage(domain: string, path: string) {
    return new Promise<CloudFrontResponse>((resolve, reject) => {
        logDebug(`Pulling page from ${domain}${path}`);
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
                    logDebug(`Parsing page`);
                    const html = parseHtml(responseBody, domain);
                    const response: CloudFrontResponse & { body: string } = {
                        body: html,
                        status: "200",
                        statusDescription: "ok",
                        headers: {}
                    };

                    // Rewrite headers from the HTTP response
                    for (const header of Object.keys(res.headers)) {
                        // We cannot set any header we want.
                        // CloudFront is restricting us from setting or changing some headers.
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

                    logDebug(`Page parsed`);
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

function parseHtml(html: string, domain: string) {
    const doc = load(html);
    const host = `https://${domain}`;

    doc("head > link").each((_i, el) => {
        prefixUrl(el, "href", host);
    });

    doc("script").each((_i, el) => {
        prefixUrl(el, "src", host);
    });

    doc("body")
        .find("img")
        .each((_i, el) => {
            prefixUrl(el, "src", host);

            // TODO handle srcset
        });

    return doc.html();
}

function prefixUrl(el: Element, attr: string, host: string) {
    const href = el.attribs[attr];
    if (href && href.startsWith("/")) {
        el.attribs[attr] = host + href;
    }
}
