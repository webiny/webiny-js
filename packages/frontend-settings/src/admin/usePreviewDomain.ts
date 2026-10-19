import { useCallback, useEffect, useRef, useState } from "react";
import { autorun } from "mobx";
import { useFeature, useLocalStorage, useLocalStorageValue } from "@webiny/app";
import { GetFrontendSettingsFeature } from "./features/getSettings/feature.js";
import { CACHE_KEY, settingsCache } from "./features/settingsCache.js";

const CUSTOM_PREVIEW_DOMAIN = "custom_preview_domain";
const DEFAULT_DOMAIN = "http://localhost:3000";

const normalizePreviewDomain = (domain: string) => domain.replace(/\/+$/, "");

const getCachedDomain = () => {
    const cached = settingsCache.get(CACHE_KEY);
    if (!cached) {
        return null;
    }
    return normalizePreviewDomain(cached.domain || DEFAULT_DOMAIN);
};

/**
 * Resolves the domain used to preview pages and entries.
 *
 * A per-user override (stored in local storage) wins over the Frontend Domain setting.
 * Until the settings are loaded, `previewDomain` is an empty string, so consumers can
 * wait instead of loading a placeholder domain first.
 */
export const usePreviewDomain = () => {
    const [settingsDomain, setSettingsDomain] = useState<string | null>(getCachedDomain);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    const localStorage = useLocalStorage();
    const storedDomain = useLocalStorageValue<string>(CUSTOM_PREVIEW_DOMAIN);
    const customDomain = storedDomain ? normalizePreviewDomain(storedDomain) : null;

    const { useCase: getSettings } = useFeature(GetFrontendSettingsFeature);

    useEffect(() => {
        let active = true;
        setError(null);
        getSettings.execute().catch(err => {
            if (active) {
                setError(err?.message || "Could not load frontend settings.");
            }
        });
        return () => {
            active = false;
        };
    }, [attempt]);

    useEffect(() => {
        return autorun(() => {
            const domain = getCachedDomain();
            if (domain) {
                setSettingsDomain(domain);
            }
        });
    }, []);

    const previewDomain = customDomain ?? settingsDomain ?? "";
    const isOverridden = Boolean(customDomain && settingsDomain && customDomain !== settingsDomain);

    // Read through a ref, so callers that memoize `setPreviewDomain` still compare against the loaded setting.
    const settingsDomainRef = useRef(settingsDomain);
    settingsDomainRef.current = settingsDomain;

    const setPreviewDomain = useCallback((domain: string) => {
        if (normalizePreviewDomain(domain) === settingsDomainRef.current) {
            localStorage.remove(CUSTOM_PREVIEW_DOMAIN);
        } else {
            localStorage.set(CUSTOM_PREVIEW_DOMAIN, domain);
        }
    }, []);

    const unsetPreviewDomain = useCallback(() => {
        localStorage.remove(CUSTOM_PREVIEW_DOMAIN);
    }, []);

    const retry = useCallback(() => setAttempt(prev => prev + 1), []);

    return {
        previewDomain,
        /**
         * The Frontend Domain setting, or `null` while it is still loading.
         */
        settingsDomain,
        isOverridden,
        isLoading: !previewDomain && !error,
        error: previewDomain ? null : error,
        setPreviewDomain,
        unsetPreviewDomain,
        retry
    };
};
