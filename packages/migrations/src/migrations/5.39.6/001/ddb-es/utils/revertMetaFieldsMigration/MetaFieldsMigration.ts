import { Logger } from "@webiny/logger";
import { SegmentProcessor } from "./SegmentProcessor";
import {
    disableElasticsearchIndexing,
    esListIndexes,
    fetchOriginalElasticsearchSettings,
    restoreOriginalElasticsearchSettings
} from "~/utils";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";
import { createWaitUntilHealthy } from "@webiny/api-elasticsearch/utils/waitUntilHealthy";
import {
    DEFAULT_ES_HEALTH_CHECKS_PARAMS,
    EsHealthChecksParams
} from "~/migrations/5.39.6/001/ddb-es/utils";
import path from "path";
import os from "os";
import fs from "fs";
import glob from "fast-glob";

export interface MetaFieldsMigrationParams {
    ddbTable: string;
    ddbEsTable: string;
    esEndpoint: string;
    totalSegments: number;
    logger: Logger;

    // Elasticsearch health check options.
    esHealthChecks?: Partial<EsHealthChecksParams>;
}

export class MetaFieldsMigration {
    private readonly runId: string;
    private readonly ddbTable: string;
    private readonly ddbEsTable: string;
    private readonly esEndpoint: string;
    private readonly totalSegments: number;
    private readonly logger: Logger;

    private readonly esHealthChecks: EsHealthChecksParams;

    constructor(params: MetaFieldsMigrationParams) {
        this.runId = String(new Date().getTime());
        this.ddbTable = params.ddbTable;
        this.ddbEsTable = params.ddbEsTable;
        this.esEndpoint = params.esEndpoint;
        this.totalSegments = params.totalSegments;
        this.logger = params.logger;
        this.esHealthChecks = {
            ...DEFAULT_ES_HEALTH_CHECKS_PARAMS,
            ...params.esHealthChecks
        };
    }

    async execute() {
        const scanProcessesPromises = [];

        const start = Date.now();
        const getDuration = () => {
            return (Date.now() - start) / 1000;
        };

        this.logger.info("Starting 5.39.6-001 meta fields data migration...");
        this.logger.info(
            {
                ddbTable: this.ddbTable,
                ddbEsTable: this.ddbEsTable,
                esEndpoint: this.esEndpoint,
                totalSegments: this.totalSegments,
                esHealthChecks: this.esHealthChecks
            },
            "Received the following parameters:"
        );

        const elasticsearchClient = createElasticsearchClient({
            endpoint: `https://${this.esEndpoint}`
        });

        this.logger.info("Checking Elasticsearch health status...");
        const waitUntilHealthy = createWaitUntilHealthy(elasticsearchClient, this.esHealthChecks);
        this.logger.info("Elasticsearch is healthy.");

        await waitUntilHealthy.wait();

        const indexes = await esListIndexes({ elasticsearchClient, match: "-headless-cms-" });
        const indexSettings: Record<string, any> = {};
        for (const indexName of indexes) {
            this.logger.info(`Disabling indexing for Elasticsearch index "${indexName}"...`);
            indexSettings[indexName] = await fetchOriginalElasticsearchSettings({
                elasticsearchClient,
                index: indexName,
                logger: this.logger
            });

            await disableElasticsearchIndexing({
                elasticsearchClient,
                index: indexName,
                logger: this.logger
            });
        }

        this.logger.info("Proceeding with the migration...");

        for (let segmentIndex = 0; segmentIndex < this.totalSegments; segmentIndex++) {
            const segmentProcessor = new SegmentProcessor({
                segmentIndex,
                runId: this.runId,
                totalSegments: this.totalSegments,
                ddbTable: this.ddbTable,
                ddbEsTable: this.ddbEsTable,
                esEndpoint: this.esEndpoint,
                esHealthChecks: this.esHealthChecks
            });

            scanProcessesPromises.push(segmentProcessor.execute());
        }

        await Promise.all(scanProcessesPromises);

        this.logger.info("Restoring original Elasticsearch settings...");
        await restoreOriginalElasticsearchSettings({
            elasticsearchClient,
            indexSettings,
            logger: this.logger
        });

        const duration = getDuration();
        this.logger.info(`5.39.6-001 migration completed in ${duration}s, here are the results...`);

        // Wait for 1 second.
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.logger.info(
            {
                totalSegments: this.totalSegments,
                esHealthChecks: this.esHealthChecks
            },
            "The migration was performed with the following following parameters:"
        );

        // Pickup all log files and print a summary of the migration.
        const logFilePaths = await glob(
            path.join(
                os.tmpdir(),
                `webiny-5-39-6-meta-fields-data-migration-log-${this.runId}-*.log`
            )
        );

        const migrationStats = {
            iterationsCount: 0,
            avgIterationDuration: 0,
            recordsScanned: 0,
            avgRecordsScannedPerIteration: 0,
            recordsScannedPerSecond: 0,
            recordsUpdated: 0,
            recordsSkipped: 0,
            esHealthChecks: {
                timeSpentWaiting: 0,
                checksCount: 0,
                unhealthyReasons: {} as Record<string, any>
            }
        };

        for (const logFilePath of logFilePaths) {
            const logFileContent = fs.readFileSync(logFilePath, "utf-8");
            const logFile = JSON.parse(logFileContent);

            migrationStats.iterationsCount += logFile.iterationsCount;
            migrationStats.recordsScanned += logFile.recordsScanned;
            migrationStats.recordsUpdated += logFile.recordsUpdated;
            migrationStats.recordsSkipped += logFile.recordsSkipped;

            migrationStats.esHealthChecks.timeSpentWaiting +=
                logFile.esHealthChecks.timeSpentWaiting;
            migrationStats.esHealthChecks.checksCount += logFile.esHealthChecks.checksCount;

            for (const unhealthyReasonType in logFile.esHealthChecks.unhealthyReasons) {
                if (!logFile.esHealthChecks.unhealthyReasons.hasOwnProperty(unhealthyReasonType)) {
                    continue;
                }

                const hasCount =
                    unhealthyReasonType in migrationStats.esHealthChecks.unhealthyReasons;
                if (hasCount) {
                    migrationStats.esHealthChecks.unhealthyReasons[unhealthyReasonType] +=
                        logFile.esHealthChecks.unhealthyReasons[unhealthyReasonType];
                } else {
                    migrationStats.esHealthChecks.unhealthyReasons[unhealthyReasonType] =
                        logFile.esHealthChecks.unhealthyReasons[unhealthyReasonType];
                }
            }
        }

        migrationStats.avgIterationDuration = duration / migrationStats.iterationsCount;

        migrationStats.avgRecordsScannedPerIteration =
            migrationStats.recordsScanned / migrationStats.iterationsCount;

        migrationStats.recordsScannedPerSecond = migrationStats.recordsScanned / duration;

        this.logger.info(
            migrationStats,
            `Migration summary (based on ${logFilePaths.length} generated logs):`
        );

        const logFilePath = path.join(
            os.tmpdir(),
            `webiny-5-39-6-meta-fields-data-migration-log-${this.runId}.log`
        );

        // Save segment processing stats to a file.
        fs.writeFileSync(logFilePath, JSON.stringify(migrationStats, null, 2));
        this.logger.trace(`Migration summary saved to "${logFilePath}".`);
    }
}
