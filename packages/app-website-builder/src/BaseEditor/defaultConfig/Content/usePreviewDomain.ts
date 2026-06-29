import { useCallback, useEffect, useState } from "react";
import { useFeature } from "@webiny/app";
import { GetSettingsFeature } from "~/features/settings/getSettings/index.js";
import { useSubscribeToLocalStorage } from "./useSubscribeToLocalStorage.js";

const CUSTOM_PREVIEW_DOMAIN = "webiny_wb_custom_preview_domain";

/**
 * Removes trailing slashes from the preview domain, so that concatenating it with a page path
 * (which always starts with a slash) never produces a double slash.
 */
const normalizePreviewDomain = (domain: string) => domain.replace(/\/+$/, "");

/**
 * This hook loads preview domain from settings, and also takes into account the override
 * via localstorage, which is a developers-only feature.
 */
export const usePreviewDomain = () => {
    const [previewDomain, setDomainFromSettings] = useState<string>("");

    const [customDomain, setCustomDomain] = useState(() =>
        window.localStorage.getItem(CUSTOM_PREVIEW_DOMAIN)
    );

    const localStorage = useSubscribeToLocalStorage(CUSTOM_PREVIEW_DOMAIN, newValue => {
        setCustomDomain(newValue);
    });

    const setPreviewDomain = useCallback(
        (domain: string) => {
            if (domain === previewDomain) {
                localStorage.unset();
            } else {
                localStorage.set(domain);
            }
        },
        [previewDomain]
    );

    const unsetPreviewDomain = useCallback(() => {
        localStorage.unset();
    }, []);

    const { useCase: getSettings } = useFeature(GetSettingsFeature);

    useEffect(() => {
        getSettings.execute().then(settings => {
            setDomainFromSettings(settings.previewDomain ?? "http://localhost:3000");
        });
    }, []);

    return {
        previewDomain: normalizePreviewDomain(customDomain ?? previewDomain),
        setPreviewDomain,
        unsetPreviewDomain,
        isOverridden: customDomain && customDomain !== previewDomain
    };
};
