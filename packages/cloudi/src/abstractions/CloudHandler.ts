import { Abstraction } from "@webiny/di";
import type { NextFunction } from "../types.js";

export interface ICloudHandler<TEvent = any, TResult = any> {
    execute(event: TEvent, next: NextFunction): Promise<TResult>;
}

export const CloudHandler = new Abstraction<ICloudHandler>("CloudHandler");

export namespace CloudHandler {
    export type Interface<TEvent = any, TResult = any> = ICloudHandler<TEvent, TResult>;
}
