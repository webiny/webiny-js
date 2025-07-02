import { createIngestorResult, IngestorResult } from "~/resolver/app/ingestor/IngestorResult.js";

describe("IngestorResult", () => {
    it("should create result and have no items", async () => {
        const result = createIngestorResult();

        expect(result).toBeInstanceOf(IngestorResult);
        expect(result.getItems()).toHaveLength(0);
    });

    it("should fail on adding item without source table", async () => {
        const result = createIngestorResult();

        console.error = jest.fn();

        result.add({
            item: {
                command: "put",
                tableName: "",
                // @ts-expect-error
                tableType: "unknownTableType",
                PK: "pk1",
                SK: "sk1"
            }
        });

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
            "Could not find table for SQS Record source:  / unknownTableType. More info in next log line."
        );
    });
});
