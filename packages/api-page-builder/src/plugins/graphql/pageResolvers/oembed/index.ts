import request from "request";
import providerList from "./providers";

const getHostname = url => {
    const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match && match.length > 2 && typeof match[2] === "string" && match[2].length > 0) {
        return match[2];
    }
    return null;
};

type ProviderEndpoint = {
    schemes: any;
    url: string;
};

type ProviderItem = {
    provider_name: string;
    provider_url: string;
    endpoints: ProviderEndpoint[];
};

const providers = providerList
    .map((item: ProviderItem) => {
        // eslint-disable-next-line camelcase,@typescript-eslint/camelcase
        const { provider_name, provider_url, endpoints } = item;

        const endpoint = endpoints[0];
        const { schemes = [], url } = endpoint;

        const hostname = getHostname(url);
        const domain = hostname ? hostname.replace("www.", "") : "";
        // eslint-disable-next-line camelcase,@typescript-eslint/camelcase
        return { provider_name, provider_url, schemes, domain, url };
    })
    .filter(item => {
        return item.domain !== "";
    });

export const findProvider = (url: string): {[key: string]: any} | null => {
    const candidates = providers.filter(provider => {
        const { schemes, domain }: any = provider;
        if (!schemes.length) {
            return url.includes(domain);
        }
        return schemes.some(scheme => {
            const reg = new RegExp(scheme.replace(/\*/g, "(.*)"), "i");
            return url.match(reg);
        });
    });

    return candidates.length > 0 ? candidates[0] : null;
};

export const fetchEmbed = async (params: {[key: string]: any}, provider: {[key: string]: any}) => {
    const link =
        `${provider.url}?format=json&` +
        Object.keys(params)
            .map(k => `${k}=${encodeURIComponent(params[k])}`)
            .join("&");

    return new Promise((resolve, reject) => {
        request(
            {
                url: link,
                json: true
            },
            (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    return resolve({ ...body, source: params });
                }
                reject(error);
            }
        );
    });
};
