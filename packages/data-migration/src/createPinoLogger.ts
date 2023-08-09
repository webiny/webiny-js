import chalk from "chalk";
import pinoPretty from "pino-pretty";
import { DataMigration } from "~/types";
import { createPinoLogger as baseCreatePinoLogger, getLogLevel, Logger } from "@webiny/logger";

export const createPinoLogger = () => {
    return baseCreatePinoLogger(
        {
            level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace")
        },
        pinoPretty({
            ignore: "pid,hostname"
        })
    );
};

export const getChildLogger = (logger: Logger, migration: DataMigration) => {
    return logger.child({}, { msgPrefix: chalk.blueBright(`[${migration.getId()}]`) + " " });
};
