import { Logger } from "@webiny/logger";
import execa from "execa";
import path from "path";

interface SegmentProcessorParams {
    region: string;
    primaryDynamoDbTable: string;
    ddbEsTable: string;
    elasticsearchEndpoint: string;
    segmentIndex: number;
    totalSegments: number;
    logger: Logger;
}

export class SegmentProcessor {
    private readonly region: string;
    private readonly primaryDynamoDbTable: string;
    private readonly ddbEsTable: string;
    private readonly elasticsearchEndpoint: string;
    private readonly segmentIndex: number;
    private readonly totalSegments: number;
    private readonly logger: Logger;

    constructor(params: SegmentProcessorParams) {
        this.region = params.region;
        this.primaryDynamoDbTable = params.primaryDynamoDbTable;
        this.ddbEsTable = params.ddbEsTable;
        this.elasticsearchEndpoint = params.elasticsearchEndpoint;
        this.segmentIndex = params.segmentIndex;
        this.totalSegments = params.totalSegments;
        this.logger = params.logger;
    }

    execute() {
        return execa(
            "node",
            [
                path.join(__dirname, "worker"),
                "--region",
                this.region,
                "--primaryDynamoDbTable",
                this.primaryDynamoDbTable,
                "--ddbEsTable",
                this.ddbEsTable,
                "--elasticsearchEndpoint",
                this.elasticsearchEndpoint,
                "--segmentIndex",
                String(this.segmentIndex),
                "--totalSegments",
                String(this.totalSegments)
            ],
            {
                stdio: "inherit",
                env: process.env
            }
        );
    }
}
