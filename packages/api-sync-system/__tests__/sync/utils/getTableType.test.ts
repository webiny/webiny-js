import { describe, expect, it } from "vitest";
import { getTableType } from "~/sync/utils/getTableType.js";

describe("getTableType", () => {
    it("should return regular table type", () => {
        const result = getTableType(process.env.DB_TABLE as string);
        expect(result).toEqual("regular");
    });

    it("should return elasticsearch table type", () => {
        const result = getTableType(process.env.DB_TABLE_ELASTICSEARCH as string);
        expect(result).toEqual("elasticsearch");
    });

    it("should return log table type", () => {
        const result = getTableType(process.env.DB_TABLE_LOG as string);
        expect(result).toEqual("log");
    });

    it("should return null for unknown table type", () => {
        const result = getTableType("unknown");
        expect(result).toBe("unknown");
    });
});
