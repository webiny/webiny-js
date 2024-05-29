import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IProcessorReason {
    maximum: number;
    current: number;
}

class ProcessorReason implements IReason {
    public readonly name = "processor";
    public readonly maximum: number;
    public readonly current: number;

    public constructor(params: IProcessorReason) {
        this.maximum = params.maximum;
        this.current = params.current;
    }
}

export const createProcessorReason = (params: IProcessorReason): IProcessorReason => {
    return new ProcessorReason(params);
};
