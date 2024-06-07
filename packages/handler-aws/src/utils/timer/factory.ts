import { ITimer } from "./abstractions/ITimer";
import { CustomTimer } from "./CustomTimer";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Timer } from "./Timer";

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
