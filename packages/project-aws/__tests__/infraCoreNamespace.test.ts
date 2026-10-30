import { describe, it, expect } from "vitest";
import { Infra } from "~/infra.js";

describe("Infra.Core namespace", () => {
    // The top-level names must keep working and resolve to the same extension types, so existing
    // webiny.config.tsx files deploy exactly as before.
    it("should expose the same components under Infra.Core and at the top level", () => {
        expect(Infra.Core.OpenSearch).toBe(Infra.OpenSearch);
        expect(Infra.Core.DynamoDb.Pitr).toBe(Infra.DynamoDb.Pitr);
        expect(Infra.Core.S3Bucket.Versioning).toBe(Infra.S3Bucket.Versioning);
    });
});
