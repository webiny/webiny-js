import { useMemo, useCallback } from "react";
import { useApolloClient } from "@apollo/client/react";
import { UpdateSettingsRepository } from "./UpdateSettings.repository.js";
import { settingsCache } from "~/shared/settingsCache.js";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";
import { UpdateSettingsGqlGateway } from "./UpdateSettings.gateway.js";

export const useUpdateWebsiteBuilderSettings = () => {
    const client = useApolloClient();

    const repository = useMemo(() => {
        return new UpdateSettingsRepository(settingsCache, new UpdateSettingsGqlGateway(client));
    }, []);

    const updateSettings = useCallback(
        (settings: IWebsiteBuilderSettings) => {
            return repository.execute(settings);
        },
        [repository]
    );

    return { updateSettings };
};
