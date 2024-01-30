import { Context as LambdaContext } from "aws-lambda/handler";
import { Context } from "~/types";
import { ITaskEvent } from "~/handler/types";
import { IResponseResult } from "~/response/abstractions";

export interface ITaskRunner<C extends Context = Context> {
    context: C;
    lambdaContext: LambdaContext;
    isCloseToTimeout: (seconds?: number) => boolean;
    getRemainingTime: () => number;

    run(event: ITaskEvent): Promise<IResponseResult>;
}
