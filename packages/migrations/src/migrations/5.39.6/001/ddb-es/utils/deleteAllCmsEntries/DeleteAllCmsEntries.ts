import { Logger } from "@webiny/logger";
import { SegmentProcessor } from "./SegmentProcessor";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";

interface SegmentProcessorParams {
    region: string;
    primaryDynamoDbTable: string;
    ddbEsTable: string;
    elasticsearchEndpoint: string;
    totalSegments: number;
    logger: Logger;
}

export class DeleteAllCmsEntries {
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

        for (let segmentIndex = 0; segmentIndex < this.totalSegments; segmentIndex++) {
            const segmentProcessor = new SegmentProcessor({
                segmentIndex,
                totalSegments: this.totalSegments,
                region: this.region,
                primaryDynamoDbTable: this.primaryDynamoDbTable,
                ddbEsTable: this.ddbEsTable,
                elasticsearchEndpoint: this.elasticsearchEndpoint
            });

            scanProcessesPromises.push(segmentProcessor.execute());
        }

        await Promise.all(scanProcessesPromises);

        this.logger.trace(`All CMS entries have been deleted. Took: ${getDuration()}s`);
    }
}
