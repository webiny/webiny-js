# Task 2: EntitySchema — attribute marshalling/unmarshalling

**Files:**
- Create: `packages/db-dynamodb/src/utils/EntitySchema.ts`
- Test: `packages/db-dynamodb/__tests__/utils/EntitySchema.test.ts`

**Interfaces:**
- Consumes: `AttributeDefinitions` type from current `toolbox.ts` (will be moved)
- Produces: `EntitySchema` class with: `marshal(item)` (adds TYPE, _et, timestamps), `unmarshal(item)` (strips non-schema keys), `toPutRequest(item)` (for batch write), `toDeleteRequest(keys)` (for batch write), `toGetKeys(keys)` (for batch get), `getSchemaAttributes()` (returns attribute name set)

This replaces what `dynamodb-toolbox`'s Entity does internally: it maps between the "user item" shape and the DDB item shape, adds metadata fields (`TYPE`, `_et`, `_ct`, `_mt`), and knows which attributes are in the schema vs. internal DDB infrastructure.

The key insight: we already store items with `strictSchemaCheck: false` in `put.ts`, meaning dynamodb-toolbox isn't actually validating or transforming attribute values. It's just adding the entity type marker and timestamps. Our `EntitySchema` does the same, much simpler.

---

- [ ] **Step 1: Write the failing test for `marshal` and `unmarshal`**

```typescript
import { EntitySchema } from "~/utils/EntitySchema.js";

describe("EntitySchema", () => {
    const schema = new EntitySchema({
        name: "CmsEntry",
        attributes: {
            PK: { partitionKey: true },
            SK: { sortKey: true },
            GSI1_PK: { type: "string" },
            GSI1_SK: { type: "string" },
            TYPE: { type: "string" },
            data: { type: "map" }
        },
        timestamps: false
    });

    it("should marshal an item by adding _et and TYPE", () => {
        const item = { PK: "T#root", SK: "A#1", data: { name: "test" }, TYPE: "cms.entry" };
        const marshalled = schema.marshal(item);
        expect(marshalled._et).toBe("CmsEntry");
        expect(marshalled.TYPE).toBe("cms.entry");
        expect(marshalled.PK).toBe("T#root");
        expect(marshalled.data).toEqual({ name: "test" });
    });

    it("should unmarshal an item by stripping infrastructure keys", () => {
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
            data: { name: "test" }
        };
        const result = schema.unmarshal(item);
        expect(result).toEqual({ data: { name: "test" }, TYPE: "cms.entry" });
        expect(result.PK).toBeUndefined();
        expect(result._et).toBeUndefined();
    });

    it("should produce a PutRequest for batch write", () => {
        const item = { PK: "T#root", SK: "A#1", TYPE: "cms.entry", data: {} };
        const request = schema.toPutRequest(item);
        expect(request).toEqual({
            PutRequest: { Item: { PK: "T#root", SK: "A#1", TYPE: "cms.entry", data: {}, _et: "CmsEntry" } }
        });
    });

    it("should produce a DeleteRequest for batch write", () => {
        const request = schema.toDeleteRequest({ PK: "T#root", SK: "A#1" });
        expect(request).toEqual({
            DeleteRequest: { Key: { PK: "T#root", SK: "A#1" } }
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/db-dynamodb --testPathPattern="EntitySchema" 2>&1 | tail -30`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `EntitySchema`**

```typescript
import type { GenericRecord } from "@webiny/api/types.js";

export type DynamoDBTypes =
    | "string"
    | "boolean"
    | "number"
    | "bigint"
    | "list"
    | "map"
    | "binary"
    | "set";

export type AttributeDefinition =
    | DynamoDBTypes
    | Partial<{
          type: DynamoDBTypes;
          partitionKey: boolean;
          sortKey: boolean;
          required: boolean | "always";
          hidden: boolean;
          default: unknown;
          map: string;
          alias: string;
          [key: string]: unknown;
      }>
    | [string, number]
    | [string, number, string]
    | [string, number, Record<string, unknown>];

export type AttributeDefinitions = Record<PropertyKey, AttributeDefinition>;

/* Keys that are DDB infrastructure, not user data. */
const INFRASTRUCTURE_KEYS = new Set([
    "PK",
    "SK",
    "GSI1_PK",
    "GSI1_SK",
    "GSI2_PK",
    "GSI2_SK",
    "GSI3_PK",
    "GSI3_SK",
    "GSI4_PK",
    "GSI4_SK",
    "GSI5_PK",
    "GSI5_SK",
    "GSI_TENANT",
    "_et",
    "_ct",
    "_mt",
    "entity",
    "created",
    "modified"
]);

export interface IEntitySchemaParams {
    name: string;
    attributes: AttributeDefinitions;
    timestamps?: boolean;
}

export class EntitySchema {
    public readonly name: string;
    private readonly attributes: AttributeDefinitions;
    private readonly schemaKeys: Set<string>;
    private readonly useTimestamps: boolean;

    public constructor(params: IEntitySchemaParams) {
        this.name = params.name;
        this.attributes = params.attributes;
        this.useTimestamps = params.timestamps !== false;
        this.schemaKeys = new Set(Object.keys(params.attributes));
    }

    public getSchemaAttributes(): Set<string> {
        return new Set(this.schemaKeys);
    }

    public marshal<T extends GenericRecord>(item: T): T & { _et: string } {
        const result = { ...item, _et: this.name } as T & { _et: string };
        if (this.useTimestamps) {
            const now = new Date().toISOString();
            if (!(result as any)._ct) {
                (result as any)._ct = now;
            }
            (result as any)._mt = now;
        }
        return result;
    }

    public unmarshal<T = GenericRecord>(item: GenericRecord): T {
        const result: GenericRecord = {};
        for (const key of Object.keys(item)) {
            if (INFRASTRUCTURE_KEYS.has(key)) {
                continue;
            }
            if (this.schemaKeys.has(key) && !INFRASTRUCTURE_KEYS.has(key)) {
                result[key] = item[key];
            }
        }
        return result as T;
    }

    public toPutRequest<T extends GenericRecord>(item: T): { PutRequest: { Item: T & { _et: string } } } {
        return {
            PutRequest: {
                Item: this.marshal(item)
            }
        };
    }

    public toDeleteRequest(keys: GenericRecord): { DeleteRequest: { Key: GenericRecord } } {
        return {
            DeleteRequest: {
                Key: keys
            }
        };
    }

    public toGetKeys(keys: GenericRecord): GenericRecord {
        return { ...keys };
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/db-dynamodb --testPathPattern="EntitySchema" 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 5: Add tests for timestamps behavior**

Test that when `timestamps: true` (default), `_ct` and `_mt` are added. Test that `_ct` is not overwritten if already present.

- [ ] **Step 6: Run tests to verify**

Run: `yarn test packages/db-dynamodb --testPathPattern="EntitySchema" 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/db-dynamodb/src/utils/EntitySchema.ts packages/db-dynamodb/__tests__/utils/EntitySchema.test.ts
git commit -m "feat(db-dynamodb): add EntitySchema for marshalling/unmarshalling"
```
