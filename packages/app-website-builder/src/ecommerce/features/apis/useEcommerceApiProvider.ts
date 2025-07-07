import { EcommerceApiProvider } from "./EcommerceApiProvider";
import { useGetEcommerceSettings } from "../settings/getSettings/useGetEcommerceSettings";

let ecommerceApiProvider: EcommerceApiProvider;

export const useEcommerceApiProvider = () => {
    const { getSettings } = useGetEcommerceSettings();

    if (!ecommerceApiProvider) {
        ecommerceApiProvider = new EcommerceApiProvider((name: string) => getSettings(name));
    }

    return ecommerceApiProvider;
};
