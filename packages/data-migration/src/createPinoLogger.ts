import chalk from "chalk";
import { pino, Logger } from "pino";
import pinoPretty from "pino-pretty";
import { DataMigration } from "~/types";

export const createPinoLogger = () => {
    return pino(
        pinoPretty({
            ignore: "pid,hostname"
        })
    );
};

export const getChildLogger = (logger: Logger, migration: DataMigration) => {
    return logger.child({}, { msgPrefix: chalk.blueBright(`[${migration.getId()}]`) + " " });
};
