import { createPinoLogger, getLogLevel } from "@webiny/logger";
import pinoPretty from "pino-pretty";
import { SegmentProcessor } from "./SegmentProcessor";

const DDB_SCAN_SEGMENTS_COUNT = 12;
const REGION = "eu-central-1";
const PRIMARY_DDB_TABLE_NAME = "wby-webiny-8546414";
const DDB_ES_TABLE_NAME = "wby-webiny-es-afefe0e";
const ELASTICSEARCH_ENDPOINT =
    "search-wby-webiny-js-84c5cef-qlecptwfzpymdjizfjbljziczu.eu-central-1.es.amazonaws.com";

(async () => {
    const parallelScanPromises = [];

    const logger = createPinoLogger(
        {
            level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace")
        },
        pinoPretty({
            ignore: "pid,hostname"
        })
    );

    const start = Date.now();
    const getDuration = () => {
        return (Date.now() - start) / 1000;
    }

    logger.trace(`Starting 5.39.6-001 migration...`);
    logger.trace(`Using segments count: ${DDB_SCAN_SEGMENTS_COUNT}`);

    for (let segmentIndex = 0; segmentIndex < DDB_SCAN_SEGMENTS_COUNT; segmentIndex++) {
        const segmentPrefix = `[segment index ${segmentIndex}]`;
        logger.trace(`${segmentPrefix} Scanning primary DynamoDB table...`);

        const segmentProcessor = new SegmentProcessor({
            region: REGION,
            segmentIndex,
            totalSegments: DDB_SCAN_SEGMENTS_COUNT,
            logger,
            primaryDynamoDbTable: PRIMARY_DDB_TABLE_NAME,
            ddbEsTable: DDB_ES_TABLE_NAME,
            elasticsearchEndpoint: ELASTICSEARCH_ENDPOINT
        });
        parallelScanPromises.push(segmentProcessor.execute());
    }

    await Promise.all(parallelScanPromises);

    logger.trace(`5.39.6-001 migration completed in ${getDuration()}s.`);
})();
