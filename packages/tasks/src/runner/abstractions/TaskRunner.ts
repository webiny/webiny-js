import { ITaskEvent } from "~/handler/types";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Context } from "~/types";
import { Reply, Request } from "@webiny/handler/types";

export interface ITaskRunner<C extends Context = Context> {
    request: Request;
    reply: Reply;
    context: C;
    event: ITaskEvent;
    lambdaContext: LambdaContext;
    isCloseToTimeout: () => boolean;
    getRemainingTime: () => number;
}
