import { useEffect, useMemo, useState } from "react";
import { getLoaderCachedData } from "./useLoader/getLoaderCachedData";
import { createObjectHash } from "./useLoader/createObjectHash";
import { useRenderer } from "..";

export interface RendererLoader<TData = Record<string, any>> {
    data: null | TData;
    loading: boolean;
    cacheHit: boolean;
}

export function useLoader<TData = Record<string, any>>(
    loaderFn: () => Promise<TData>
): RendererLoader<TData> {
    const { getElement, enableLoaderCache } = useRenderer();

    const element = getElement();
    const loaderCachingEnabled = enableLoaderCache !== false;
    const elementDataHash = createObjectHash(element.data);

    const loaderCachedData = useMemo<Awaited<ReturnType<typeof loaderFn>>>(() => {
        if (loaderCachingEnabled) {
            return getLoaderCachedData(element);
        }
        return null;
    }, []);

    const [loader, setLoader] = useState<RendererLoader<TData>>(
        loaderCachedData
            ? {
                  data: loaderCachedData,
                  loading: false,
                  cacheHit: true
              }
            : { data: null, loading: true, cacheHit: false }
    );

    useEffect(() => {
        if (loader.cacheHit) {
            return;
        }

        loaderFn().then(data => {
            if (loaderCachingEnabled) {
                const html = `<pe-loader-data-cache data-key="${
                    element.id
                }-${elementDataHash}" data-value='${JSON.stringify(data)}'></pe-loader-data-cache>`;
                document.body.insertAdjacentHTML("beforeend", html);
            }
            setLoader({ ...loader, data, loading: false });
        });
    }, [elementDataHash]);

    return loader;
}
