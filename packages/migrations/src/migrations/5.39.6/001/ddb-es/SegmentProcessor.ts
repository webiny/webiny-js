import execa from "execa";
import path from "path";
import { EsHealthChecksParams } from "~/migrations/5.39.6/001/ddb-es/utils";

interface SegmentProcessorParams {
    runId: string;
    ddbTable: string;
    ddbEsTable: string;
    esEndpoint: string;
    segmentIndex: number;
    totalSegments: number;
    esHealthChecks: EsHealthChecksParams;
}

export class SegmentProcessor {
    private readonly runId: string;
    private readonly ddbTable: string;
    private readonly ddbEsTable: string;
    private readonly esEndpoint: string;
    private readonly segmentIndex: number;
    private readonly totalSegments: number;
    private readonly esHealthChecks: EsHealthChecksParams;

    constructor(params: SegmentProcessorParams) {
        this.runId = params.runId;
        this.ddbTable = params.ddbTable;
        this.ddbEsTable = params.ddbEsTable;
        this.esEndpoint = params.esEndpoint;
        this.segmentIndex = params.segmentIndex;
        this.totalSegments = params.totalSegments;
        this.esHealthChecks = params.esHealthChecks;
    }

    execute() {
        return execa(
            "node",
            [
                path.join(__dirname, "worker"),
                "--runId",
                this.runId,
                "--ddbTable",
                this.ddbTable,
                "--ddbEsTable",
                this.ddbEsTable,
                "--esEndpoint",
                this.esEndpoint,
                "--segmentIndex",
                String(this.segmentIndex),
                "--totalSegments",
                String(this.totalSegments),

                // Elasticsearch health check options.
                "--esHealthMinClusterHealthStatus",
                this.esHealthChecks.minClusterHealthStatus,
                "--esHealthMaxProcessorPercent",
                String(this.esHealthChecks.maxProcessorPercent),
                "--esHealthMaxRamPercent",
                String(this.esHealthChecks.maxRamPercent),
                "--esHealthMaxWaitingTime",
                String(this.esHealthChecks.maxWaitingTime),
                "--esHealthWaitingTimeStep",
                String(this.esHealthChecks.waitingTimeStep)
            ],
            {
                stdio: "inherit",
                env: process.env
            }
        );
    }
}
