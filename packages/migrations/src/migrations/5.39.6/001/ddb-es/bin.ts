#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Migration } from "./Migration";
import { createPinoLogger, getLogLevel } from "@webiny/logger";
import pinoPretty from "pino-pretty";

const argv = yargs(hideBin(process.argv))
    .options({
        region: { type: "string", demandOption: true },
        primaryDynamoDbTable: { type: "string", demandOption: true },
        ddbEsTable: { type: "string", demandOption: true },
        elasticsearchEndpoint: { type: "string", demandOption: true },
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

    const migration = new Migration({
        totalSegments: argv.segments,
        region: argv.region,
        primaryDynamoDbTable: argv.primaryDynamoDbTable,
        ddbEsTable: argv.ddbEsTable,
        elasticsearchEndpoint: argv.elasticsearchEndpoint,
        logger
    });

    await migration.execute();
})();
