import Log from "./log";
import type { LogType } from "../types";

export class ConsoleLog extends Log {
    constructor(message: string, type: LogType, data: ?{}) {
        super(message, type, data);
        ConsoleLog.output(message);
    }

    static output(message) {
        console.log(message);
    }
}
