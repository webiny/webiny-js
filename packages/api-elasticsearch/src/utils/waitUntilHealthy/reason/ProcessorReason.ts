import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IProcessorReasonParams {
    maximum: number;
    current: number;
    description?: string;
}

export class ProcessorReason implements IReason {
    public readonly name = "processor";
    public readonly maximum: number;
    public readonly current: number;
    public readonly description?: string;

    public constructor(params: IProcessorReasonParams) {
        this.maximum = params.maximum;
        this.current = params.current;
        this.description = params.description;
    }
}

export const createProcessorReason = (params: IProcessorReasonParams): ProcessorReason => {
    return new ProcessorReason(params);
};
