import type {
    IGetScheduleActionGateway,
    IGetScheduleActionGatewayResponse
} from "~/Gateways/index.js";
import {useState} from "react";

export interface IGetScheduleActionParams {
    app: string;
    id: string;
    gateway: IGetScheduleActionGateway;
}

export interface  IUseGetScheduleActionResponse {
    loading: boolean;
    error: Error | null;
    data: IGetScheduleActionGatewayResponse;
}

export const useGetScheduleAction = (params: IGetScheduleActionParams): IUseGetScheduleActionResponse => {
    
    const [item, setItem] = useState<IGetScheduleActionGatewayResponse | null>(null);
    
    
    
    
    return {
        loading: false,
        error: null,
        data: item
    }
}
