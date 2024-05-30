import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IProcessorReasonParams {
    maximum: number;
    current: number;
}

export class ProcessorReason implements IReason {
    public readonly name = "processor";
    public readonly maximum: number;
    public readonly current: number;

    public constructor(params: IProcessorReasonParams) {
        this.maximum = params.maximum;
        this.current = params.current;
    }
}

export const createProcessorReason = (params: IProcessorReasonParams): ProcessorReason => {
    return new ProcessorReason(params);
};
