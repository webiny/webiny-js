import { useMemo, useCallback } from "react";
import { useApolloClient } from "@apollo/client/react";
import { UpdateSettingsRepository } from "./UpdateSettings.repository.js";
import { settingsCache } from "~/shared/settingsCache.js";
import { UpdateSettingsGateway } from "./UpdateSettings.gateway.js";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export const useUpdateEcommerceSettings = () => {
    const client = useApolloClient();

    const repository = useMemo(() => {
        return new UpdateSettingsRepository(settingsCache, new UpdateSettingsGateway(client));
    }, []);

    const updateSettings = useCallback(
        (settings: AllEcommerceSettings) => {
            return repository.execute(settings);
        },
        [repository]
    );

    return { updateSettings };
};
