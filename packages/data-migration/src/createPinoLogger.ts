import chalk from "chalk";
import { DataMigration } from "~/types";
import { createPinoLogger as baseCreatePinoLogger, getLogLevel, Logger } from "@webiny/logger";

export const createPinoLogger = () => {
    return baseCreatePinoLogger({
        level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace")
    });
};

export const getChildLogger = (logger: Logger, migration: DataMigration) => {
    return logger.child({}, { msgPrefix: chalk.blueBright(`[${migration.getId()}]`) + " " });
};
