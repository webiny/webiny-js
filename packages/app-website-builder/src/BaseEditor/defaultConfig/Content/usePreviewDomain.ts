import { useCallback } from "react";
import { useLocalStorage } from "@webiny/app";
import { usePreviewDomain as useSharedPreviewDomain } from "@webiny/frontend-settings/exports/admin";

const CUSTOM_PREVIEW_DOMAIN = "custom_preview_domain";

export const usePreviewDomain = () => {
    const { previewDomain, isOverridden } = useSharedPreviewDomain();
    const localStorage = useLocalStorage();

    const setPreviewDomain = useCallback(
        (domain: string) => {
            if (domain === previewDomain) {
                localStorage.remove(CUSTOM_PREVIEW_DOMAIN);
            } else {
                localStorage.set(CUSTOM_PREVIEW_DOMAIN, domain);
            }
        },
        [previewDomain]
    );

    const unsetPreviewDomain = useCallback(() => {
        localStorage.remove(CUSTOM_PREVIEW_DOMAIN);
    }, []);

    return {
        previewDomain,
        setPreviewDomain,
        unsetPreviewDomain,
        isOverridden
    };
};
