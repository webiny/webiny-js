import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/client/react";
import { GetSettingsRepository } from "./GetSettings.repository.js";
import { GetSettingsGateway } from "./GetSettings.gateway.js";
import { settingsCache } from "~/shared/settingsCache.js";

export const useGetEcommerceSettings = () => {
    const client = useApolloClient();

    const repository = useMemo(() => {
        return new GetSettingsRepository(settingsCache, new GetSettingsGateway(client));
    }, []);

    const getSettings = useCallback(() => {
        return repository.execute();
    }, [repository]);

    return { getSettings };
};
