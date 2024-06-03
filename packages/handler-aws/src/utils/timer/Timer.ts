import { ITimer } from "./abstractions/ITimer";

export interface ITimerCb {
    (): number;
}

export class Timer implements ITimer {
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
