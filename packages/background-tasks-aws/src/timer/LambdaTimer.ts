import type { Timer } from "@webiny/utils/features/Timer/abstraction.js";

interface LambdaTimerFactory {
    getRemainingTimeInMillis(): number;
}

export class LambdaTimer implements Timer.Interface {
    private readonly factory: LambdaTimerFactory;

    public constructor(factory: LambdaTimerFactory) {
        this.factory = factory;
    }

    public getRemainingMilliseconds(): number {
        return this.factory.getRemainingTimeInMillis();
    }

    public getRemainingSeconds(): number {
        return Math.floor(this.getRemainingMilliseconds() / 1000);
    }
}
