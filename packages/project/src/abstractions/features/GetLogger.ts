import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type LoggerService } from "~/abstractions/index.js";

type IGetLoggerResult = LoggerService.Interface;

export interface IGetLogger {
    execute(): IGetLoggerResult;
}

export const GetLogger = createAbstraction<IGetLogger>("GetLogger");

export namespace GetLogger {
    export type Interface = IGetLogger;
}
