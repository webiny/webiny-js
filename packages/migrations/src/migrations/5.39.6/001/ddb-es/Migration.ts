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
import { ElasticsearchCatHealthStatus } from "@webiny/api-elasticsearch/operations/types";

interface SegmentProcessorParams {
    region: string;
    primaryDynamoDbTable: string;
    ddbEsTable: string;
    elasticsearchEndpoint: string;
    totalSegments: number;
    logger: Logger;
}

export class Migration {
    private readonly region: string;
    private readonly primaryDynamoDbTable: string;
    private readonly ddbEsTable: string;
    private readonly elasticsearchEndpoint: string;
    private readonly totalSegments: number;
    private readonly logger: Logger;

    constructor(params: SegmentProcessorParams) {
        this.region = params.region;
        this.primaryDynamoDbTable = params.primaryDynamoDbTable;
        this.ddbEsTable = params.ddbEsTable;
        this.elasticsearchEndpoint = params.elasticsearchEndpoint;
        this.totalSegments = params.totalSegments;
        this.logger = params.logger;
    }

    async execute() {
        const scanProcessesPromises = [];

        const start = Date.now();
        const getDuration = () => {
            return (Date.now() - start) / 1000;
        };

        // Disable indexing for HCMS Elasticsearch index.
        const elasticsearchClient = createElasticsearchClient({
            endpoint: `https://${this.elasticsearchEndpoint}`
        });

        // TODO: make these configurable outside of the script.

        this.logger.trace("Checking Elasticsearch health status...");
        const waitUntilHealthy = createWaitUntilHealthy(elasticsearchClient, {
            minStatus: ElasticsearchCatHealthStatus.Yellow,
            maxProcessorPercent: 75,
            maxRamPercent: 100,
            maxWaitingTime: 60,
            waitingTimeStep: 5
        });
        this.logger.trace("Elasticsearch is healthy.");

        await waitUntilHealthy.wait();

        const indexes = await esListIndexes({ elasticsearchClient, match: "-headless-cms-" });
        const indexSettings: Record<string, any> = {};
        for (const indexName of indexes) {
            this.logger.trace(`Disabling indexing for Elasticsearch index "${indexName}"...`);
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

        this.logger.trace("Proceeding with the migration...");

        for (let segmentIndex = 0; segmentIndex < this.totalSegments; segmentIndex++) {
            const segmentProcessor = new SegmentProcessor({
                segmentIndex,
                totalSegments: this.totalSegments,
                region: this.region,
                primaryDynamoDbTable: this.primaryDynamoDbTable,
                ddbEsTable: this.ddbEsTable,
                elasticsearchEndpoint: this.elasticsearchEndpoint,
                logger: this.logger
            });

            scanProcessesPromises.push(segmentProcessor.execute());
        }

        await Promise.all(scanProcessesPromises);

        this.logger.trace("Restoring original Elasticsearch settings...");
        await restoreOriginalElasticsearchSettings({
            elasticsearchClient,
            indexSettings,
            logger: this.logger
        });

        this.logger.trace(`5.39.6-001 migration completed in ${getDuration()}s.`);
    }
}
