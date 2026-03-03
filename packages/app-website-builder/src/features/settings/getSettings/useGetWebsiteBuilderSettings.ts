import { useMemo, useCallback } from "react";
import { useApolloClient } from "@apollo/client/react";
import { GetSettingsRepository } from "./GetSettings.repository.js";
import { GetSettingsGqlGateway } from "./GetSettings.gateway.js";
import { settingsCache } from "~/shared/settingsCache.js";

export const useGetWebsiteBuilderSettings = () => {
    const client = useApolloClient();

    const repository = useMemo(() => {
        return new GetSettingsRepository(settingsCache, new GetSettingsGqlGateway(client));
    }, []);

    const getSettings = useCallback(() => {
        return repository.execute();
    }, [repository]);

    return { getSettings };
};
