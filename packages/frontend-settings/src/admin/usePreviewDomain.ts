import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature, useLocalStorageValue } from "@webiny/app";
import { GetFrontendSettingsFeature } from "./features/getSettings/feature.js";
import { CACHE_KEY, settingsCache } from "./features/settingsCache.js";

const CUSTOM_PREVIEW_DOMAIN = "custom_preview_domain";
const DEFAULT_DOMAIN = "http://localhost:3000";

const normalizePreviewDomain = (domain: string) => domain.replace(/\/+$/, "");

export const usePreviewDomain = () => {
    const [settingsDomain, setSettingsDomain] = useState<string>("");

    const customDomain = useLocalStorageValue<string>(CUSTOM_PREVIEW_DOMAIN) ?? null;

    const { useCase: getSettings } = useFeature(GetFrontendSettingsFeature);

    useEffect(() => {
        getSettings.execute();
    }, []);

    useEffect(() => {
        return autorun(() => {
            const cached = settingsCache.get(CACHE_KEY);
            if (cached) {
                setSettingsDomain(cached.domain ?? DEFAULT_DOMAIN);
            }
        });
    }, []);

    const previewDomain = normalizePreviewDomain(
        customDomain ?? (settingsDomain || DEFAULT_DOMAIN)
    );
    const isOverridden = Boolean(customDomain && customDomain !== settingsDomain);

    return {
        previewDomain,
        isOverridden
    };
};
