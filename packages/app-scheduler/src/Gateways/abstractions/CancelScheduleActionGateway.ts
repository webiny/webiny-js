export interface ICancelScheduleActionGatewayParams {
    namespace: string;
    id: string;
}

export interface ICancelScheduleActionGateway {
    execute(params: ICancelScheduleActionGatewayParams): Promise<void>;
}
