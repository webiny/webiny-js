import type { Timer } from "./abstraction.js";
import { CallbackTimer } from "./CallbackTimer.js";
import { CountdownTimer } from "./CountdownTimer.js";

export interface ITimerFactoryParams {
    getRemainingTimeInMillis(): number;
}

export const timerFactory = (params?: Partial<ITimerFactoryParams>): Timer.Interface => {
    const countdown = new CountdownTimer();

    return new CallbackTimer(() => {
        if (params?.getRemainingTimeInMillis) {
            return params.getRemainingTimeInMillis();
        }
        return countdown.getRemainingMilliseconds();
    });
};
