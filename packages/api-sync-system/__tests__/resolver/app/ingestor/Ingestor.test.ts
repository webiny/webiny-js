import { createIngestor, Ingestor } from "~/resolver/app/ingestor/Ingestor.js";
import { createIngestorResult, IngestorResult } from "~/resolver/app/ingestor/IngestorResult.js";
import { createMockSourceDeployment } from "~tests/mocks/deployments.js";
import { createMockSQSEvent } from "~tests/mocks/sqsEvent.js";
import { createRecordsValidation } from "~/resolver/app/RecordsValidation.js";

describe("Ingestor", () => {
    const source = createMockSourceDeployment();

    it("should ingest empty array", async () => {
        const ingestor = createIngestor({
            createIngestorResult,
            getSource() {
                return source;
            }
        });

        expect(ingestor).toBeInstanceOf(Ingestor);

        const result = await ingestor.ingest({
            records: []
        });

        expect(result).toBeInstanceOf(IngestorResult);
        expect(result.getItems()).toEqual([]);
    });

    it("should ingest items", async () => {
        const ingestor = createIngestor({
            createIngestorResult,
            getSource() {
                return source;
            }
        });

        const event = createMockSQSEvent();

        const validation = await createRecordsValidation().validate(event.Records);

        expect(validation.error).toBeUndefined();
        const records = validation.records || [];

        const result = await ingestor.ingest({
            records
        });

        expect(result).toBeInstanceOf(IngestorResult);
        const items = result.getItems();
        expect(items).toHaveLength(1);
        expect(items).toMatchObject([
            {
                PK: "pk1",
                SK: "sk1"
            }
        ]);
    });
});
