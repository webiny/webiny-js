import { getElementCacheKey } from "./getElementCacheKey";
import { Element } from "~/types";

export const getLoaderCachedData = (element: Element) => {
    const elementCacheKey = getElementCacheKey(element);
    let data = localStorage[`pe_loader_data_cache_${elementCacheKey}`];
    if (data) {
        return data;
    }

    data = window?.__PE_LOADER_DATA_CACHE__?.[elementCacheKey];
    if (data) {
        return data;
    }

    const htmlElement = document.querySelector(
        `pe-loader-data-cache[data-key="${elementCacheKey}"]`
    );
    if (!htmlElement) {
        return null;
    }

    const cachedResultElementValue = htmlElement.getAttribute("data-value");
    if (!cachedResultElementValue) {
        return null;
    }

    try {
        return JSON.parse(cachedResultElementValue);
    } catch {
        return null;
    }
};
