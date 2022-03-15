import fetch from "node-fetch";
import { providerList } from "./providers";

const getHostname = (url: string): string | null => {
    const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match && match.length > 2 && typeof match[2] === "string" && match[2].length > 0) {
        return match[2];
    }
    return null;
};

interface Provider {
    provider_name: string;
    provider_url: string;
    schemes: string[];
    domain: string;
    url: string;
}

const providers: Provider[] = providerList
    .map(item => {
        const { provider_name, provider_url, endpoints } = item;

        const endpoint = endpoints[0];
        const { schemes = [], url } = endpoint;

        const hostname = getHostname(url);
        const domain = hostname ? hostname.replace("www.", "") : "";
        return {
            provider_name,
            provider_url,
            schemes,
            domain,
            url
        };
    })
    .filter(item => {
        return item.domain !== "";
    });

export const findProvider = (url: string): Provider | null => {
    const candidates = providers.filter(provider => {
        const { schemes, domain } = provider;
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

interface FetchEmbedParams {
    [key: string]: any;
}
interface FetchEmbedProvider {
    url: string;
}

export const fetchEmbed = async (params: FetchEmbedParams, provider: FetchEmbedProvider) => {
    const link =
        `${provider.url}?format=json&` +
        Object.keys(params)
            .map(k => `${k}=${encodeURIComponent(params[k])}`)
            .join("&");

    const json = await fetch(link).then(res => res.json());
    return { ...json, source: params };
};
