import type {
    IGetScheduleActionGateway,
    IGetScheduleActionGatewayResponse
} from "~/Gateways/index.js";
import { useEffect, useState } from "react";
import { useSnackbar } from "@webiny/app-admin";

export interface IGetScheduleActionParams {
    namespace: string;
    id: string;
    gateway: IGetScheduleActionGateway;
}

export const useGetScheduleAction = (
    params: IGetScheduleActionParams
): IGetScheduleActionGatewayResponse | null => {
    const { gateway, namespace, id } = params;

    const { showSnackbar } = useSnackbar();

    const [response, setResponse] = useState<IGetScheduleActionGatewayResponse | null>(null);

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
