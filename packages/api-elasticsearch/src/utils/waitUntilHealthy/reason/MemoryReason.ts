import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IMemoryReasonParams {
    maximum: number;
    current: number;
}

export class MemoryReason implements IReason {
    public readonly name = "memory";
    public readonly maximum: number;
    public readonly current: number;

    public constructor(params: IMemoryReasonParams) {
        this.maximum = params.maximum;
        this.current = params.current;
    }
}

export const createMemoryReason = (params: IMemoryReasonParams): MemoryReason => {
    return new MemoryReason(params);
};
