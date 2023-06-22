const { pino } = require("pino");
const pinoPretty = require("pino-pretty");

const createPinoLogger = () => {
    return pino(
        { level: "silent" },
        pinoPretty({
            ignore: "pid,hostname"
        })
    );
};

const logger = createPinoLogger();

module.exports = {
    createPinoLogger,
    logger
};
