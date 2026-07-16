import type { Timer as TimerAbstraction } from "@webiny/utils/features/Timer/abstraction.js";
import { CustomTimer } from "./CustomTimer.js";
import type { Context as LambdaContext } from "@webiny/aws-sdk/types/index.js";
import { Timer } from "./Timer.js";

export type ITimerFactoryParams = Pick<LambdaContext, "getRemainingTimeInMillis">;

export const timerFactory = (params?: Partial<ITimerFactoryParams>): TimerAbstraction.Interface => {
    const customTimer = new CustomTimer();

    return new Timer(() => {
        if (params?.getRemainingTimeInMillis) {
            return params.getRemainingTimeInMillis();
        }
        return customTimer.getRemainingMilliseconds();
    });
};
