#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { MetaFieldsMigration } from "./MetaFieldsMigration";
import { createPinoLogger, getLogLevel } from "@webiny/logger";
import pinoPretty from "pino-pretty";
import {
    DEFAULT_ES_HEALTH_CHECKS_PARAMS,
    EsHealthChecksParams
} from "~/migrations/5.39.6/001/ddb-es/utils";

const argv = yargs(hideBin(process.argv))
    .options({
        ddbTable: { type: "string", demandOption: true },
        ddbEsTable: { type: "string", demandOption: true },
        esEndpoint: { type: "string", demandOption: true },
        segments: { type: "number", demandOption: true },

        // Elasticsearch health check options.
        esHealthMinClusterHealthStatus: {
            type: "string",
            demandOption: false,
            default: DEFAULT_ES_HEALTH_CHECKS_PARAMS.minClusterHealthStatus,
            description: `Minimum cluster health status to wait for before proceeding with the migration.`
        },
        esHealthMaxProcessorPercent: {
            type: "number",
            demandOption: false,
            default: DEFAULT_ES_HEALTH_CHECKS_PARAMS.maxProcessorPercent,
            description: `Maximum CPU usage percentage to wait for before proceeding with the migration.`
        },
        esHealthMaxRamPercent: {
            type: "number",
            demandOption: false,
            default: DEFAULT_ES_HEALTH_CHECKS_PARAMS.maxRamPercent,
            description: `Maximum RAM usage percentage to wait for before proceeding with the migration.`
        },
        esHealthMaxWaitingTime: {
            type: "number",
            demandOption: false,
            default: DEFAULT_ES_HEALTH_CHECKS_PARAMS.maxWaitingTime,
            description: `Maximum time to wait (seconds) for before proceeding with the migration.`
        },
        esHealthWaitingTimeStep: {
            type: "number",
            demandOption: false,
            default: DEFAULT_ES_HEALTH_CHECKS_PARAMS.waitingTimeStep,
            description: `Time step (seconds) to wait before checking Elasticsearch health status again.`
        }
    })
    .parseSync();

(async () => {
    const logger = createPinoLogger(
        {
            level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace")
        },
        pinoPretty({ ignore: "pid,hostname" })
    );

    const migration = new MetaFieldsMigration({
        totalSegments: argv.segments,
        ddbTable: argv.ddbTable,
        ddbEsTable: argv.ddbEsTable,
        esEndpoint: argv.esEndpoint,
        esHealthChecks: {
            minClusterHealthStatus:
                argv.esHealthMinClusterHealthStatus as EsHealthChecksParams["minClusterHealthStatus"],
            maxProcessorPercent: argv.esHealthMaxProcessorPercent,
            maxRamPercent: argv.esHealthMaxRamPercent,
            maxWaitingTime: argv.esHealthMaxWaitingTime,
            waitingTimeStep: argv.esHealthWaitingTimeStep
        },
        logger
    });

    await migration.execute();
})();
