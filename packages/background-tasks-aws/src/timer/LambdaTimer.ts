import type { ITimer } from "@webiny/background-tasks/api";

interface LambdaTimerFactory {
    getRemainingTimeInMillis(): number;
}

export class LambdaTimer implements ITimer {
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
