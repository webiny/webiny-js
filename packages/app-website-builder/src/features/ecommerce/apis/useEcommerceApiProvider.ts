import { useFeature } from "@webiny/app";
import { EcommerceApiProvider } from "./EcommerceApiProvider.js";
import { GetEcommerceSettingsFeature } from "~/features/ecommerce/settings/getSettings/index.js";

let ecommerceApiProvider: EcommerceApiProvider;

export const useEcommerceApiProvider = () => {
    const { useCase: getSettings } = useFeature(GetEcommerceSettingsFeature);

    if (!ecommerceApiProvider) {
        ecommerceApiProvider = new EcommerceApiProvider(async (name: string) => {
            const settings = await getSettings.execute();
            return settings[name];
        });
    }

    return ecommerceApiProvider;
};
