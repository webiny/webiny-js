import { useEffect, useState } from "react";
import type { PreviewUrlModifier } from "./abstractions.js";
import { usePreviewUrlModifier } from "./usePreviewUrlModifier.js";

interface ModifiedUrl {
    baseUrl: string;
    modifier: PreviewUrlModifier.Interface;
    url: string | null;
}

/**
 * The preview URL after every registered `PreviewUrlModifier` has run, or null while there is no base URL.
 * While the modifiers run for a new base URL, and when one fails, the URL is null: never the previous
 * URL, nor a partly modified one (either could preview the wrong content).
 */
export const useModifiedPreviewUrl = (baseUrl: string | null) => {
    const modifier = usePreviewUrlModifier();
    const [modified, setModified] = useState<ModifiedUrl | null>(null);

    useEffect(() => {
        if (!baseUrl || !modifier) {
            return;
        }

        let current = true;
        const urlObj = new URL(baseUrl);
        modifier
            .modify(urlObj)
            .then(() => {
                if (current) {
                    setModified({ baseUrl, modifier, url: urlObj.toString() });
                }
            })
            .catch(error => {
                console.error(`Could not modify the preview URL "${baseUrl}".`, error);
                if (current) {
                    setModified({ baseUrl, modifier, url: null });
                }
            });

        return () => {
            current = false;
        };
    }, [baseUrl, modifier]);

    if (!baseUrl || !modifier) {
        return baseUrl;
    }
    // A result made for another base URL or modifier is outdated.
    if (modified?.baseUrl !== baseUrl || modified.modifier !== modifier) {
        return null;
    }
    return modified.url;
};
