import { Logger } from "@webiny/logger";
import { SegmentProcessor } from "./SegmentProcessor";

interface SegmentProcessorParams {
    ddbTable: string;
    ddbEsTable: string;
    totalSegments: number;
    logger: Logger;
}

export class DeleteAllCmsEntries {
    private readonly ddbTable: string;
    private readonly ddbEsTable: string;
    private readonly totalSegments: number;
    private readonly logger: Logger;

    constructor(params: SegmentProcessorParams) {
        this.ddbTable = params.ddbTable;
        this.ddbEsTable = params.ddbEsTable;
        this.totalSegments = params.totalSegments;
        this.logger = params.logger;
    }

    async execute() {
        const scanProcessesPromises = [];

        const start = Date.now();
        const getDuration = () => {
            return (Date.now() - start) / 1000;
        };

        for (let segmentIndex = 0; segmentIndex < this.totalSegments; segmentIndex++) {
            const segmentProcessor = new SegmentProcessor({
                segmentIndex,
                totalSegments: this.totalSegments,
                ddbTable: this.ddbTable,
                ddbEsTable: this.ddbEsTable
            });

            scanProcessesPromises.push(segmentProcessor.execute());
        }

        await Promise.all(scanProcessesPromises);

        this.logger.trace(`All CMS entries have been deleted. Took: ${getDuration()}s`);
    }
}
