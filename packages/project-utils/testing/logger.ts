import { pino } from "pino";
import pinoPretty from "pino-pretty";

export const createPinoLogger = () => {
    return pino(
        { level: "silent" },
        pinoPretty({
            ignore: "pid,hostname"
        })
    );
};

export const logger = createPinoLogger();
