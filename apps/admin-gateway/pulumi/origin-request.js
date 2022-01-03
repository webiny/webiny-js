const https = require("https");

const stageCookie = "webiny-stage";

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

    let stage = getCookieStage(config, request);
    if (stage) {
        // If stage is selected via cookie it can be safely cached on CDN,
        // because cookie is included into caching key.
        selectStage({ request, stage, cache: true });
        return request;
    }

    stage = getRandomStage(config);
    if (stage) {
        // For randomly selected stage we cannot cache it in CDN,
        // because the same pair URL/cookie may result in different returned resources.
        // That's because of randomization process
        selectStage({ request, stage, cache: false });
        return request;
    }

    return {
        statusCode: 404,
        body: "No deployed stage found"
    };
};

function setHeader(headers, header) {
    headers[header.key] = [header];
}

function getRequestCookies(request) {
    const header = getRequestHeader(request, "cookie");
    const cookies = {};

    if (!header) {
        return cookies;
    }

    const cookiesArray = decodeURIComponent(header).split(";");

    for (const cookie of cookiesArray) {
        const [name, value] = cookie.trim().split("=");
        cookies[name] = value;
    }

    return cookies;
}

function getRequestHeader(request, name) {
    const header = request.headers[name];
    return header && header[0] && header[0].value;
}

function getCookieStage(config, request) {
    const cookies = getRequestCookies(request);
    const stageName = cookies[stageCookie];
    const stageConfig = stageName ? config[stageName] : null;

    if (!stageConfig) {
        return null;
    }

    return {
        name: stageName,
        config: stageConfig
    };
}

function getRandomStage(config) {
    let totalWeight = 0;

    const stages = Object.keys(config);
    for (const stage of stages) {
        const stageConfig = config[stage];
        if (stageConfig.weight) {
            // do not count bad or negative weights
            totalWeight += stageConfig.weight;
        }
    }

    if (totalWeight <= 0) {
        return null;
    }

    let random = Math.random() * totalWeight;
    let selectedStageName = null;
    let selectedStageConfig = null;

    console.log(`Randomized ${random}/${totalWeight}`);
    for (const version of stages) {
        const versionConfig = config[version];
        if (!versionConfig.weight) {
            continue;
        }

        console.log(`Version ${version}, weight ${versionConfig.weight}/${random}`);

        if (random <= versionConfig.weight) {
            selectedStageName = version;
            selectedStageConfig = versionConfig;
            break;
        } else {
            random -= versionConfig.weight;
        }
    }

    return {
        name: selectedStageName,
        config: selectedStageConfig
    };
}

function selectStage({ request, stage, cache }) {
    console.log(`Forwarding to ${stage.config.domain}`);

    request.origin = {
        custom: {
            domainName: stage.config.domain,
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
        value: stage.config.domain
    });

    setHeader(request.headers, {
        key: "x-webiny-stage",
        value: stage.name
    });

    setHeader(request.headers, {
        key: "x-webiny-cache",
        value: String(cache || false)
    });
}
