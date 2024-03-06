import { Context as LambdaContext } from "aws-lambda/handler";
import { ITimer } from "./abstractions/ITimer";

export type ILambdaContextTimerContext = Pick<LambdaContext, "getRemainingTimeInMillis">;

export class LambdaContextTimer implements ITimer {
    private readonly context: ILambdaContextTimerContext;

    public constructor(context: ILambdaContextTimerContext) {
        this.context = context;
    }

    public getRemainingMilliseconds(): number {
        return this.context.getRemainingTimeInMillis();
    }
}
