import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IMemoryReason {
    maximum: number;
    current: number;
}

class MemoryReason implements IReason {
    public readonly name = "memory";
    public readonly maximum: number;
    public readonly current: number;

    public constructor(params: IMemoryReason) {
        this.maximum = params.maximum;
        this.current = params.current;
    }
}

export const createMemoryReason = (params: IMemoryReason): IMemoryReason => {
    return new MemoryReason(params);
};
