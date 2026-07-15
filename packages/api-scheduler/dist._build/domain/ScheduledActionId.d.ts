export interface IScheduledActionIdParams {
    namespace: string;
    actionType: string;
    targetId: string;
}
export declare class ScheduledActionId {
    static from(params: IScheduledActionIdParams): string;
}
