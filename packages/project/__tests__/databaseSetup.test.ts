import { describe, expect, it } from "vitest";
import { DatabaseSetup } from "~/extensions/DatabaseSetup.js";

const schema = DatabaseSetup.def.paramsSchema as Exclude<
    typeof DatabaseSetup.def.paramsSchema,
    ((...args: any[]) => unknown) | undefined
>;

describe("DatabaseSetup", () => {
    it("accepts every database setup, including pg", () => {
        for (const setupName of ["ddb", "ddb+es", "ddb+os", "pg"]) {
            expect(schema.safeParse({ setupName }).success).toBe(true);
        }
    });

    it("rejects an unknown database setup", () => {
        expect(schema.safeParse({ setupName: "mysql" }).success).toBe(false);
    });
});
