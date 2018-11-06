// @flow
import fetch from "node-fetch";
import providerList from "./providers.json";

const getHostname = url => {
    let match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match && match.length > 2 && typeof match[2] === "string" && match[2].length > 0) {
        return match[2];
    }
    return null;
};

const providers = providerList
    .map(item => {
        // eslint-disable-next-line camelcase
        let { provider_name, provider_url, endpoints } = item;

        let endpoint = endpoints[0];
        let { schemes = [], url } = endpoint;

        let hostname = getHostname(url);
        let domain = hostname ? hostname.replace("www.", "") : "";
        // eslint-disable-next-line camelcase
        return { provider_name, provider_url, schemes, domain, url };
    })
    .filter(item => {
        return item.domain !== "";
    });

export const findProvider = (url: string): Object => {
    let candidates = providers.filter(provider => {
        let { schemes, domain } = provider;
        if (!schemes.length) {
            return url.includes(domain);
        }
        return schemes.some(scheme => {
            let reg = new RegExp(scheme.replace(/\*/g, "(.*)"), "i");
            return url.match(reg);
        });
    });

    return candidates.length > 0 ? candidates[0] : null;
};

export const fetchEmbed = async (params: Object, provider: Object) => {
    let link =
        `${provider.url}?format=json&` +
        Object.keys(params)
            .map(k => `${k}=${encodeURIComponent(params[k])}`)
            .join("&");

    const res = await fetch(link);
    return { ...(await res.json()), source: params };
};
