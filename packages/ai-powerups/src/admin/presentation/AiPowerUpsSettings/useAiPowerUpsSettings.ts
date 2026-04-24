import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { GetSettingsFeature } from "~/admin/features/settings/getSettings/feature.js";
import { SharedSettingsFeature } from "~/admin/features/settings/shared/feature.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

export function useAiPowerUpsSettings() {
    const { useCase } = useFeature(GetSettingsFeature);
    const { settingsCache } = useFeature(SharedSettingsFeature);

    const [settings, setSettings] = useState<IAiPowerUpsSettings | null>(() => settingsCache.get());

    useEffect(() => {
        void useCase.execute();
    }, [useCase]);

    useEffect(() => {
        return autorun(() => {
            const data = settingsCache.get();
            setSettings(data);
        });
    }, [settingsCache]);

    return { settings };
}
