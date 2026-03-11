export interface ICancelScheduleActionGatewayParams {
    app: string;
    id: string;
}

export interface ICancelScheduleActionGateway {
    execute(params: ICancelScheduleActionGatewayParams): Promise<void>;
}
