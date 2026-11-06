import { useEffect, useState } from "react";
import { usePreviewUrlModifier } from "./usePreviewUrlModifier.js";

/**
 * The preview URL after every registered `PreviewUrlModifier` has run, or null while there is no base URL.
 * When a modifier fails, the URL is null rather than the partly modified one (which could preview the wrong
 * content). A result for a base URL that has since changed is dropped.
 */
export const useModifiedPreviewUrl = (baseUrl: string | null) => {
    const modifier = usePreviewUrlModifier();
    const [url, setUrl] = useState<string | null>(modifier ? null : baseUrl);

    useEffect(() => {
        if (!baseUrl || !modifier) {
            setUrl(baseUrl);
            return;
        }

        let current = true;
        const urlObj = new URL(baseUrl);
        modifier
            .modify(urlObj)
            .then(() => {
                if (current) {
                    setUrl(urlObj.toString());
                }
            })
            .catch(error => {
                console.error(`Could not modify the preview URL "${baseUrl}".`, error);
                if (current) {
                    setUrl(null);
                }
            });

        return () => {
            current = false;
        };
    }, [baseUrl, modifier]);

    return url;
};
