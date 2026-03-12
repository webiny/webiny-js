import type {
    IGetScheduleActionGateway,
    IGetScheduleActionGatewayResponse
} from "~/Gateways/index.js";
import { useEffect, useState } from "react";
import { useSnackbar } from "@webiny/app-admin";

export interface IGetScheduleActionParams {
    app: string;
    id: string;
    gateway: IGetScheduleActionGateway;
}

export const useGetScheduleAction = (
    params: IGetScheduleActionParams
): IGetScheduleActionGatewayResponse | null => {
    const { gateway, app, id } = params;

    const { showSnackbar } = useSnackbar();

    const [response, setResponse] = useState<IGetScheduleActionGatewayResponse | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await gateway.execute({
                    app,
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
