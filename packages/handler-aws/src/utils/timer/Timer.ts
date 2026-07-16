import type { Timer as TimerAbstraction } from "@webiny/utils/features/Timer/abstraction.js";

export interface ITimerCb {
    (): number;
}

export class Timer implements TimerAbstraction.Interface {
    private readonly cb: ITimerCb;

    public constructor(cb: ITimerCb) {
        this.cb = cb;
    }
    public getRemainingMilliseconds(): number {
        return this.cb();
    }

    public getRemainingSeconds(): number {
        const result = this.cb();
        if (result > 0) {
            return Math.floor(result / 1000);
        }
        return 0;
    }
}
