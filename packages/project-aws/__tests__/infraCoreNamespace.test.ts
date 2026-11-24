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

    it("has Infra.AuroraPostgres at the top level only, and no RdsProxy or AWS Infra.Postgres", () => {
        expect(Infra.AuroraPostgres).toBeDefined();
        expect(Infra).not.toHaveProperty("Postgres");
        expect(Infra).not.toHaveProperty("RdsProxy");
        expect(Infra.Core).not.toHaveProperty("RdsProxy");
        expect(Infra.Core).not.toHaveProperty("AuroraPostgres");
    });
});
