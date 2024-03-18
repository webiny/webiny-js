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
}
