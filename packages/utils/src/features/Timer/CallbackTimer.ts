import type { Timer } from "./abstraction.js";

export class CallbackTimer implements Timer.Interface {
    private readonly cb: () => number;

    public constructor(cb: () => number) {
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
