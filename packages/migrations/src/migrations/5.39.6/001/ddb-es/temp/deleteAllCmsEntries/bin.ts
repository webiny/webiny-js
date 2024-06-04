#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { DeleteAllCmsEntries } from "./DeleteAllCmsEntries";
import { createPinoLogger, getLogLevel } from "@webiny/logger";
import pinoPretty from "pino-pretty";

const argv = yargs(hideBin(process.argv))
    .options({
        ddbTable: { type: "string", demandOption: true },
        ddbEsTable: { type: "string", demandOption: true },
        segments: { type: "number", demandOption: true }
    })
    .parseSync();

(async () => {
    const logger = createPinoLogger(
        {
            level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace")
        },
        pinoPretty({ ignore: "pid,hostname" })
    );

    const deleteAllCmsEntries = new DeleteAllCmsEntries({
        totalSegments: argv.segments,
        ddbTable: argv.ddbTable,
        ddbEsTable: argv.ddbEsTable,
        logger
    });

    await deleteAllCmsEntries.execute();
})();
