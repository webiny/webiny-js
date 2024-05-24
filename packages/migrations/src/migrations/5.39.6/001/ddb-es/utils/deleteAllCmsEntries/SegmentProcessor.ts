import execa from "execa";
import path from "path";

interface SegmentProcessorParams {
    ddbTable: string;
    ddbEsTable: string;
    segmentIndex: number;
    totalSegments: number;
}

export class SegmentProcessor {
    private readonly ddbTable: string;
    private readonly ddbEsTable: string;
    private readonly segmentIndex: number;
    private readonly totalSegments: number;

    constructor(params: SegmentProcessorParams) {
        this.ddbTable = params.ddbTable;
        this.ddbEsTable = params.ddbEsTable;
        this.segmentIndex = params.segmentIndex;
        this.totalSegments = params.totalSegments;
    }

    async execute() {
        return execa(
            "node",
            [
                path.join(__dirname, "worker"),
                "--ddbTable",
                this.ddbTable,
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
