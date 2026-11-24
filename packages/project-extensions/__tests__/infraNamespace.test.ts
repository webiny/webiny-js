import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Infra } from "~/namespaces/infra.js";

/*
 * `webiny/extensions` exports this `Infra`. The top-level names must keep resolving to the same
 * extensions as their grouped names, so existing webiny.config.tsx files render as before.
 */
describe("Infra namespace", () => {
    it("exposes the same components under Infra.Core and at the top level", () => {
        expect(Infra.Core.OpenSearch).toBe(Infra.OpenSearch);
        expect(Infra.Core.DynamoDb.Pitr).toBe(Infra.DynamoDb.Pitr);
        expect(Infra.Core.S3Bucket.Versioning).toBe(Infra.S3Bucket.Versioning);
    });

    it("exposes the same encryption component under Infra.Crypto and at the top level", () => {
        expect(Infra.Crypto.Encryption).toBe(Infra.Encryption);
    });
});
