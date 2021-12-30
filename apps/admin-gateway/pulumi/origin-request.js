const https = require("https");

exports.handler = async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;
    const domain = cf.config.distributionDomainName;

    const configPath = "/_config.json";

    if (request.uri === configPath) {
        // requesting the config file, pass it through
        return request;
    }

    const config = await new Promise((resolve, reject) => {
        let dataString = "";

        const req = https.get(
            {
                hostname: domain,
                port: 443,
                path: configPath
            },
            function (res) {
                res.on("data", chunk => {
                    dataString += chunk;
                });
                res.on("end", () => {
                    resolve(JSON.parse(dataString));
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

    let totalWeight = 0;
    const versions = Object.keys(config);
    for (const version of versions) {
        const versionConfig = config[version];
        if (versionConfig.weight) {
            // do not count bad or negative weights
            totalWeight += versionConfig.weight;
        }
    }

    if (totalWeight <= 0) {
        return {
            statusCode: 404,
            body: "No version deployed"
        };
    }

    let random = Math.random() * totalWeight;

    console.log(`Randomized ${random}/${totalWeight}`);
    let selectedVersion = null;
    for (const version of versions) {
        const versionConfig = config[version];
        if (!versionConfig.weight) {
            continue;
        }

        console.log(`Version ${version}, weight ${versionConfig.weight}/${random}`);

        if (random <= versionConfig.weight) {
            selectedVersion = versionConfig;
            break;
        } else {
            random -= versionConfig.weight;
        }
    }

    if (!selectedVersion) {
        return {
            statusCode: 404,
            body: "No version"
        };
    }

    console.log(`Forwarding to ${selectedVersion.url}`);

    request.origin = {
        custom: {
            domainName: selectedVersion.url,
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
        value: selectedVersion.url
    });

    setHeader(request.headers, {
        key: "x-webiny-no-cache",
        value: "true"
    });

    return request;
};

// function pointsToFile(uri) {
//     return /\/[^/]+\.[^/]+$/.test(uri);
// }

function setHeader(headers, header) {
    headers[header.key] = [header];
}
