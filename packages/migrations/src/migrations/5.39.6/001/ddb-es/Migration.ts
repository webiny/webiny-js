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

interface SegmentProcessorParams {
    ddbTable: string;
    ddbEsTable: string;
    esEndpoint: string;
    totalSegments: number;
    logger: Logger;

    // Elasticsearch health check options.
    esHealthChecks?: Partial<EsHealthChecksParams>;
}

export class Migration {
    private readonly ddbTable: string;
    private readonly ddbEsTable: string;
    private readonly esEndpoint: string;
    private readonly totalSegments: number;
    private readonly logger: Logger;

    private readonly esHealthChecks: EsHealthChecksParams;

    constructor(params: SegmentProcessorParams) {
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

        // Disable indexing for HCMS Elasticsearch index.
        const elasticsearchClient = createElasticsearchClient({
            endpoint: `https://${this.esEndpoint}`
        });

        this.logger.trace("Checking Elasticsearch health status...");
        const waitUntilHealthy = createWaitUntilHealthy(elasticsearchClient, this.esHealthChecks);
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
                ddbTable: this.ddbTable,
                ddbEsTable: this.ddbEsTable,
                esEndpoint: this.esEndpoint,
                esHealthChecks: this.esHealthChecks
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
