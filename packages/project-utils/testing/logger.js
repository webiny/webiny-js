const { pino } = require("pino");
const pinoPretty = require("pino-pretty");

export const createPinoLogger = () => {
    return pino(
        { level: "silent" },
        pinoPretty({
            ignore: "pid,hostname"
        })
    );
};

export const logger = createPinoLogger();
