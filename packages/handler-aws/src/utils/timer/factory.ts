import { CustomTimer, Timer, type ITimer } from "@webiny/handler/timer/index.js";
import type { Context as LambdaContext } from "@webiny/aws-sdk/types/index.js";

export type ITimerFactoryParams = Pick<LambdaContext, "getRemainingTimeInMillis">;

export const timerFactory = (params?: Partial<ITimerFactoryParams>): ITimer => {
    const customTimer = new CustomTimer();

    return new Timer(() => {
        if (params?.getRemainingTimeInMillis) {
            return params.getRemainingTimeInMillis();
        }
        return customTimer.getRemainingMilliseconds();
    });
};
