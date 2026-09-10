import { describe, it, expect } from "vitest";
import knexLib from "knex";
import type { Knex } from "knex";
import { datesToIsoStrings, withKnexDefaults } from "../src/knexDefaults.js";

const ISO = "2026-08-04T17:02:06.028Z";

describe("datesToIsoStrings", () => {
    it("should convert dates in a list of rows", () => {
        const result = datesToIsoStrings([
            { id: "a", createdOn: new Date(ISO) },
            { id: "b", createdOn: new Date(ISO) }
        ]);

        expect(result).toEqual([
            { id: "a", createdOn: ISO },
            { id: "b", createdOn: ISO }
        ]);
    });

    it("should convert dates in a single row", () => {
        const result = datesToIsoStrings({ id: "a", createdOn: new Date(ISO) });

        expect(result).toEqual({ id: "a", createdOn: ISO });
    });

    it("should convert dates in a raw Postgres result and keep its other properties", () => {
        const result = datesToIsoStrings({
            command: "SELECT",
            rowCount: 1,
            rows: [{ id: "a", createdOn: new Date(ISO) }]
        });

        expect(result).toEqual({
            command: "SELECT",
            rowCount: 1,
            rows: [{ id: "a", createdOn: ISO }]
        });
    });

    it("should leave values that are already strings alone", () => {
        const result = datesToIsoStrings([{ id: "a", createdOn: ISO }]);

        expect(result).toEqual([{ id: "a", createdOn: ISO }]);
    });

    it("should leave nulls, numbers and buffers alone", () => {
        const buffer = Buffer.from("hello");

        const result = datesToIsoStrings([
            { lastSeen: null, count: 3, payload: buffer, flag: false }
        ]);

        expect(result).toEqual([{ lastSeen: null, count: 3, payload: buffer, flag: false }]);
    });

    it("should tolerate scalars and empty results", () => {
        expect(datesToIsoStrings(null)).toBeNull();
        expect(datesToIsoStrings(undefined)).toBeUndefined();
        expect(datesToIsoStrings(7)).toBe(7);
        expect(datesToIsoStrings([])).toEqual([]);
    });

    it("should return the same object reference so driver metadata is not lost", () => {
        const rows = [{ id: "a", createdOn: new Date(ISO) }];

        expect(datesToIsoStrings(rows)).toBe(rows);
    });
});

describe("withKnexDefaults", () => {
    it("should install a postProcessResponse hook", () => {
        const config = withKnexDefaults({ client: "better-sqlite3" });

        expect(typeof config.postProcessResponse).toBe("function");
    });

    it("should keep the rest of the config untouched", () => {
        const config = withKnexDefaults({
            client: "better-sqlite3",
            connection: { filename: ":memory:" },
            useNullAsDefault: true
        });

        expect(config.client).toBe("better-sqlite3");
        expect(config.connection).toEqual({ filename: ":memory:" });
        expect(config.useNullAsDefault).toBe(true);
    });

    it("should still run a postProcessResponse the caller provided, with dates converted", () => {
        const seen: unknown[] = [];
        const config = withKnexDefaults({
            client: "better-sqlite3",
            postProcessResponse: result => {
                seen.push(result);
                return "replaced";
            }
        });

        const output = config.postProcessResponse!([{ createdOn: new Date(ISO) }], {});

        expect(seen).toEqual([[{ createdOn: ISO }]]);
        expect(output).toBe("replaced");
    });
});

describe("withKnexDefaults against a real driver", () => {
    /**
     * better-sqlite3 returns text columns verbatim, so this covers the passthrough case end to end:
     * a value written as an ISO string comes back as the identical string, and the hook doesn't
     * disturb the rest of the row. The `Date` conversion itself is driver-specific and is covered by
     * the unit tests above, which use the shape node-postgres and mysql2 produce.
     */
    const createKnex = (): Knex => {
        return knexLib(
            withKnexDefaults({
                client: "better-sqlite3",
                connection: { filename: ":memory:" },
                useNullAsDefault: true
            })
        );
    };

    it("should read an ISO timestamp back unchanged", async () => {
        const knex = createKnex();

        try {
            await knex.schema.createTable("things", table => {
                table.text("id").primary();
                table.text("createdOn").notNullable();
                table.integer("size").notNullable();
            });

            await knex("things").insert({ id: "a", createdOn: ISO, size: 42 });

            const rows = await knex("things").select("*");
            expect(rows).toEqual([{ id: "a", createdOn: ISO, size: 42 }]);

            const first = await knex("things").where("id", "a").first();
            expect(first.createdOn).toBe(ISO);
            expect(typeof first.createdOn).toBe("string");
        } finally {
            await knex.destroy();
        }
    });
});
