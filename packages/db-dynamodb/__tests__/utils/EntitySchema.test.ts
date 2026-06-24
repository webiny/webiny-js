import { describe, it, expect } from "vitest";
import { EntitySchema } from "~/utils/EntitySchema";

describe("EntitySchema", () => {
    const createSchema = (params?: { timestamps?: boolean }) => {
        return new EntitySchema({
            name: "TestEntity",
            attributes: {
                PK: { partitionKey: true },
                SK: { sortKey: true },
                GSI1_PK: { type: "string" },
                GSI1_SK: { type: "string" },
                TYPE: { type: "string" },
                data: { type: "map" },
                title: { type: "string" },
                status: { type: "string" }
            },
            timestamps: params?.timestamps
        });
    };

    describe("marshal", () => {
        it("should add _et set to entity name", () => {
            const schema = createSchema({ timestamps: false });
            const item = { PK: "T#root", SK: "A#1", data: { name: "test" } };

            const result = schema.marshal(item);

            expect(result._et).toBe("TestEntity");
            expect(result.PK).toBe("T#root");
            expect(result.SK).toBe("A#1");
            expect(result.data).toEqual({ name: "test" });
        });

        it("should not add _ct or _mt when timestamps is false", () => {
            const schema = createSchema({ timestamps: false });
            const item = { PK: "T#root", SK: "A#1" };

            const result = schema.marshal(item);

            expect(result._et).toBe("TestEntity");
            expect(result).not.toHaveProperty("_ct");
            expect(result).not.toHaveProperty("_mt");
        });

        it("should add _ct and _mt when timestamps is true (default)", () => {
            const schema = createSchema();
            const item = { PK: "T#root", SK: "A#1" };

            const result = schema.marshal(item);

            expect(result._et).toBe("TestEntity");
            expect(result).toHaveProperty("_ct");
            expect(result).toHaveProperty("_mt");
            expect(typeof (result as any)["_ct"]).toBe("string");
            expect(typeof (result as any)["_mt"]).toBe("string");
        });

        it("should not overwrite _ct if already present", () => {
            const schema = createSchema();
            const existingTimestamp = "2024-01-01T00:00:00.000Z";
            const item = { PK: "T#root", SK: "A#1", _ct: existingTimestamp };

            const result = schema.marshal(item);

            expect((result as any)["_ct"]).toBe(existingTimestamp);
            expect(result).toHaveProperty("_mt");
        });

        it("should set _mt even when _ct already exists", () => {
            const schema = createSchema();
            const item = { PK: "T#root", SK: "A#1", _ct: "2024-01-01T00:00:00.000Z" };

            const result = schema.marshal(item);

            expect((result as any)["_mt"]).toBeDefined();
            expect((result as any)["_mt"]).not.toBe("2024-01-01T00:00:00.000Z");
        });
    });

    describe("unmarshal", () => {
        it("should strip all infrastructure keys", () => {
            const schema = createSchema();
            const item = {
                PK: "T#root",
                SK: "A#1",
                GSI1_PK: "G#1",
                GSI1_SK: "G#2",
                _et: "TestEntity",
                _ct: "2024-01-01T00:00:00.000Z",
                _mt: "2024-01-01T00:00:00.000Z",
                entity: "TestEntity",
                created: "2024-01-01",
                modified: "2024-01-01",
                TYPE: "test.entity",
                GSI_TENANT: "root",
                data: { name: "test" },
                title: "Hello",
                status: "active"
            };

            const result = schema.unmarshal(item);

            expect(result).toEqual({
                data: { name: "test" },
                title: "Hello",
                status: "active"
            });
        });

        it("should strip keys not in schema even if not infrastructure", () => {
            const schema = createSchema();
            const item = {
                PK: "T#root",
                SK: "A#1",
                data: { name: "test" },
                extraKey: "should be removed",
                anotherExtra: 42
            };

            const result = schema.unmarshal(item);

            expect(result).toEqual({
                data: { name: "test" }
            });
        });

        it("should return only schema keys that are not infrastructure keys", () => {
            const schema = createSchema();
            const item = {
                PK: "T#root",
                SK: "A#1",
                GSI1_PK: "G#1",
                GSI1_SK: "G#2",
                _et: "CmsEntry",
                _ct: "2024-01-01",
                _mt: "2024-01-01",
                entity: "CmsEntry",
                TYPE: "cms.entry",
                data: { name: "test" },
                extraKey: "value"
            };

            const result = schema.unmarshal(item);

            /* Only data is a schema key that is NOT in infrastructure. */
            expect(result).toEqual({ data: { name: "test" } });
        });

        it("should strip all GSI keys", () => {
            const schema = new EntitySchema({
                name: "BigEntity",
                attributes: {
                    PK: { partitionKey: true },
                    SK: { sortKey: true },
                    GSI1_PK: { type: "string" },
                    GSI1_SK: { type: "string" },
                    GSI2_PK: { type: "string" },
                    GSI2_SK: { type: "string" },
                    GSI3_PK: { type: "string" },
                    GSI3_SK: { type: "string" },
                    GSI4_PK: { type: "string" },
                    GSI4_SK: { type: "string" },
                    GSI5_PK: { type: "string" },
                    GSI5_SK: { type: "string" },
                    data: { type: "map" }
                }
            });

            const item = {
                PK: "T#root",
                SK: "A#1",
                GSI1_PK: "g1pk",
                GSI1_SK: "g1sk",
                GSI2_PK: "g2pk",
                GSI2_SK: "g2sk",
                GSI3_PK: "g3pk",
                GSI3_SK: "g3sk",
                GSI4_PK: "g4pk",
                GSI4_SK: "g4sk",
                GSI5_PK: "g5pk",
                GSI5_SK: "g5sk",
                data: { value: 123 }
            };

            const result = schema.unmarshal(item);

            expect(result).toEqual({ data: { value: 123 } });
        });

        it("should handle an empty item", () => {
            const schema = createSchema();
            const result = schema.unmarshal({});
            expect(result).toEqual({});
        });

        it("should handle item with only infrastructure keys", () => {
            const schema = createSchema();
            const item = {
                PK: "T#root",
                SK: "A#1",
                _et: "TestEntity",
                _ct: "2024-01-01",
                _mt: "2024-01-01"
            };

            const result = schema.unmarshal(item);

            expect(result).toEqual({});
        });

        it("should strip TYPE even though it is in schema attributes", () => {
            const schema = createSchema();
            const item = {
                TYPE: "some.type",
                data: { name: "test" }
            };

            const result = schema.unmarshal(item);

            expect(result).toEqual({ data: { name: "test" } });
        });
    });

    describe("toPutRequest", () => {
        it("should wrap item in PutRequest format with _et", () => {
            const schema = createSchema({ timestamps: false });
            const item = { PK: "T#root", SK: "A#1", data: { name: "test" } };

            const result = schema.toPutRequest(item);

            expect(result).toEqual({
                PutRequest: {
                    Item: {
                        PK: "T#root",
                        SK: "A#1",
                        data: { name: "test" },
                        _et: "TestEntity"
                    }
                }
            });
        });

        it("should include timestamps when enabled", () => {
            const schema = createSchema();
            const item = { PK: "T#root", SK: "A#1" };

            const result = schema.toPutRequest(item);

            expect(result.PutRequest.Item._et).toBe("TestEntity");
            expect(result.PutRequest.Item).toHaveProperty("_ct");
            expect(result.PutRequest.Item).toHaveProperty("_mt");
        });
    });

    describe("toDeleteRequest", () => {
        it("should wrap keys in DeleteRequest format", () => {
            const schema = createSchema();
            const keys = { PK: "T#root", SK: "A#1" };

            const result = schema.toDeleteRequest(keys);

            expect(result).toEqual({
                DeleteRequest: {
                    Key: {
                        PK: "T#root",
                        SK: "A#1"
                    }
                }
            });
        });

        it("should return a copy of the keys, not the original reference", () => {
            const schema = createSchema();
            const keys = { PK: "T#root", SK: "A#1" };

            const result = schema.toDeleteRequest(keys);

            expect(result.DeleteRequest.Key).not.toBe(keys);
            expect(result.DeleteRequest.Key).toEqual(keys);
        });
    });

    describe("toGetKeys", () => {
        it("should return a copy of the keys", () => {
            const schema = createSchema();
            const keys = { PK: "T#root", SK: "A#1" };

            const result = schema.toGetKeys(keys);

            expect(result).toEqual(keys);
            expect(result).not.toBe(keys);
        });
    });

    describe("getSchemaAttributes", () => {
        it("should return the set of attribute names", () => {
            const schema = createSchema();

            const attrs = schema.getSchemaAttributes();

            expect(attrs).toBeInstanceOf(Set);
            expect(attrs.has("PK")).toBe(true);
            expect(attrs.has("SK")).toBe(true);
            expect(attrs.has("GSI1_PK")).toBe(true);
            expect(attrs.has("GSI1_SK")).toBe(true);
            expect(attrs.has("TYPE")).toBe(true);
            expect(attrs.has("data")).toBe(true);
            expect(attrs.has("title")).toBe(true);
            expect(attrs.has("status")).toBe(true);
            expect(attrs.size).toBe(8);
        });

        it("should return a new set each time (not a reference to the internal set)", () => {
            const schema = createSchema();

            const attrs1 = schema.getSchemaAttributes();
            const attrs2 = schema.getSchemaAttributes();

            expect(attrs1).not.toBe(attrs2);
            expect(attrs1).toEqual(attrs2);
        });
    });

    describe("constructor", () => {
        it("should default timestamps to true", () => {
            const schema = new EntitySchema({
                name: "Test",
                attributes: { PK: { partitionKey: true } }
            });

            const result = schema.marshal({ PK: "T#root" });

            expect(result).toHaveProperty("_ct");
            expect(result).toHaveProperty("_mt");
        });

        it("should accept timestamps as false", () => {
            const schema = new EntitySchema({
                name: "Test",
                attributes: { PK: { partitionKey: true } },
                timestamps: false
            });

            const result = schema.marshal({ PK: "T#root" });

            expect(result).not.toHaveProperty("_ct");
            expect(result).not.toHaveProperty("_mt");
        });

        it("should store the entity name", () => {
            const schema = new EntitySchema({
                name: "MyEntity",
                attributes: {}
            });

            expect(schema.name).toBe("MyEntity");
        });
    });
});
