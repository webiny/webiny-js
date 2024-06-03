import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IMemoryReasonParams {
    maximum: number;
    current: number;
    description?: string;
}

export class MemoryReason implements IReason {
    public readonly name = "memory";
    public readonly maximum: number;
    public readonly current: number;
    public readonly description?: string;

    public constructor(params: IMemoryReasonParams) {
        this.maximum = params.maximum;
        this.current = params.current;
        this.description = params.description;
    }
}

export const createMemoryReason = (params: IMemoryReasonParams): MemoryReason => {
    return new MemoryReason(params);
};
