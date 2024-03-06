import { ILambdaContextTimerContext, LambdaContextTimer } from "./LambdaContextTimer";
import { ITimer } from "~/timer/abstractions/ITimer";
import { CustomTimer } from "./CustomTimer";

export const timerFactory = (context: Partial<ILambdaContextTimerContext>): ITimer => {
    if (!context?.getRemainingTimeInMillis) {
        return new CustomTimer();
    }
    // Safe to cast as we check for the existing method above.
    // TODO figure out why TypeScript is not happy with the above check.
    return new LambdaContextTimer(context as ILambdaContextTimerContext);
};
