import execa from "execa";
import path from "path";

interface SegmentProcessorParams {
    region: string;
    primaryDynamoDbTable: string;
    ddbEsTable: string;
    elasticsearchEndpoint: string;
    segmentIndex: number;
    totalSegments: number;
}

export class SegmentProcessor {
    private readonly region: string;
    private readonly primaryDynamoDbTable: string;
    private readonly ddbEsTable: string;
    private readonly elasticsearchEndpoint: string;
    private readonly segmentIndex: number;
    private readonly totalSegments: number;

    constructor(params: SegmentProcessorParams) {
        this.region = params.region;
        this.primaryDynamoDbTable = params.primaryDynamoDbTable;
        this.ddbEsTable = params.ddbEsTable;
        this.elasticsearchEndpoint = params.elasticsearchEndpoint;
        this.segmentIndex = params.segmentIndex;
        this.totalSegments = params.totalSegments;
    }

    async execute() {
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
                "--segmentIndex",
                String(this.segmentIndex),
                "--totalSegments",
                String(this.totalSegments)
            ],
            {
                stdio: "inherit",
                env: process.env
            }
        )
    }
}
