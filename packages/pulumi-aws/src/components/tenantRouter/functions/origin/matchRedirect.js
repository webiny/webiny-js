exports.matchRedirect = (request, redirects) => {
    const headers = request.headers;

    // Build the full URL from the request
    const protocol = headers["cloudfront-forwarded-proto"]
        ? headers["cloudfront-forwarded-proto"][0].value
        : "https";
    const hostname = headers.host[0].value;
    const uri = request.uri.replace("/index.html", "");
    const querystring = request.querystring ? `?${request.querystring}` : "";

    const fullUrl = `${protocol}://${hostname}${uri}${querystring}`;
    const fullUrlNoQuery = `${protocol}://${hostname}${uri}`;

    // Try to find a match (priority: with query > without query > path only)
    let redirectConfig = redirects[fullUrl] || redirects[fullUrlNoQuery] || redirects[uri];

    // If no match found, return null
    if (!redirectConfig) {
        return null;
    }

    // Return a function that generates the redirect response
    return () => {
        // Build redirect URL
        let redirectTo = redirectConfig.to;

        // If redirect.to is a path (not full URL), prepend current domain
        if (!redirectTo.startsWith("http://") && !redirectTo.startsWith("https://")) {
            redirectTo = `${protocol}://${hostname}${redirectTo}`;
        }

        console.log("REDIRECTING!", redirectTo);

        return {
            status: redirectConfig.permanent ? "301" : "302",
            statusDescription: redirectConfig.permanent ? "Moved Permanently" : "Found",
            headers: {
                location: [
                    {
                        key: "Location",
                        value: redirectTo
                    }
                ],
                "cache-control": [
                    {
                        key: "Cache-Control",
                        value: "max-age=" + redirectConfig.maxAge
                    }
                ]
            }
        };
    };
};
