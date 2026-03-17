import type {
    IGetScheduledActionGateway,
    IGetScheduledActionGatewayResponse
} from "~/Gateways/index.js";
import { useEffect, useState } from "react";
import { useSnackbar } from "@webiny/app-admin";

export interface IGetScheduledActionParams {
    namespace: string;
    id: string;
    gateway: IGetScheduledActionGateway;
}

export const useGetScheduledAction = (
    params: IGetScheduledActionParams
): IGetScheduledActionGatewayResponse | null => {
    const { gateway, namespace, id } = params;

    const { showSnackbar } = useSnackbar();

    const [response, setResponse] = useState<IGetScheduledActionGatewayResponse | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await gateway.execute({
                    namespace,
                    id
                });
                setResponse(data);
            } catch (err) {
                console.error(err);
                showSnackbar(err.message);
            }
        };
        fetchData();
    }, []);

    return response;
};
