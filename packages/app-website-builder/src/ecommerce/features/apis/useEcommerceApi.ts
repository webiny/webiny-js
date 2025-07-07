import { useEcommerceApiProvider } from "~/ecommerce/features/apis/useEcommerceApiProvider";
import { IEcommerceApi } from "~/ecommerce";
import { useEffect, useState } from "react";

export const useEcommerceApi = (pluginName: string) => {
    const provider = useEcommerceApiProvider();
    const [api, setApi] = useState<IEcommerceApi | undefined>(undefined);

    useEffect(() => {
        provider.getApi(pluginName).then(api => {
            setApi(api);
        });
    }, []);

    return { api };
};
