export interface ICancelScheduledActionGatewayParams {
    namespace: string;
    id: string;
}

export interface ICancelScheduledActionGateway {
    execute(params: ICancelScheduledActionGatewayParams): Promise<void>;
}
