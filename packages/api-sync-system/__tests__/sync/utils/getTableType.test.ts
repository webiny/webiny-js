import { describe, expect, it } from "vitest";
import { getTableType } from "~/sync/utils/getTableType.js";

describe("getTableType", () => {
    it("should return regular table type", () => {
        const result = getTableType(process.env.DB_TABLE as string);
        expect(result).toEqual("regular");
    });

    it("should return opensearch table type", () => {
        const result = getTableType(process.env.DB_TABLE_OPENSEARCH as string);
        expect(result).toEqual("opensearch");
    });

    it("should return null for unknown table type", () => {
        const result = getTableType("unknown");
        expect(result).toBe("unknown");
    });
});
