import { useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { GetSettingsRepository } from "./GetSettingsRepository";
import { GetSettingsGqlGateway } from "./GetSettingsGraphQlGateway";
import { settingsCache } from "../settingsCache";
import type { IGetEcommerceSettings } from "./IGetEcommerceSettings";
import type { IEcommerceSettings } from "../IEcommerceSettings";

class KiboSettings implements IGetEcommerceSettings {
    private readonly decoratee: IGetEcommerceSettings;

    constructor(decoratee: IGetEcommerceSettings) {
        this.decoratee = decoratee;
    }

    async execute(name: string): Promise<IEcommerceSettings | undefined> {
        if (name === "KiboCommerce") {
            return {
                apiHost: String(process.env.WEBINY_ADMIN_KIBO_API_HOST),
                sharedSecret: String(process.env.WEBINY_ADMIN_KIBO_SHARED_SECRET),
                clientId: String(process.env.WEBINY_ADMIN_KIBO_CLIENT_ID),
                authToken: String(process.env.WEBINY_ADMIN_KIBO_AUTH_TOKEN)
            };
        }

        return this.decoratee.execute(name);
    }
}

export const useGetEcommerceSettings = () => {
    const client = useApolloClient();

    const repository = useMemo(() => {
        return new GetSettingsRepository(
            settingsCache,
            new KiboSettings(new GetSettingsGqlGateway(client))
        );
    }, []);

    const getSettings = async (name: string) => {
        return repository.execute(name);
    };

    return { getSettings };
};
