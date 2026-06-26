# Field-to-Column Mapping

How CMS field types map to SQL columns, including nested fields, list fields, and special types.

---

## Core Principle

Every CMS field gets a real SQL column (not JSONB). This enables native SQL filtering, sorting, and indexing on field values. The only exceptions are list fields and deeply nested structures where JSONB is used.

---

## Scalar Fields

| CMS Field Type | SQL Column Type | Storage Format | Searchable | Sortable |
|---|---|---|---|---|
| `text` | `string` (varchar) | Plain text | Yes | Yes |
| `long-text` | `text` | Plain text (transform override bypasses compression) | Yes (`contains` only) | No |
| `number` | `float` | Numeric | Yes | Yes |
| `boolean` | `boolean` | `true`/`false` (Knex maps per dialect) | Yes | Yes |
| `datetime` (date) | `string` | ISO 8601 text | Yes | Yes |
| `datetime` (time) | `float` | Numeric seconds | Yes | Yes |
| `datetime` (dateTimeWithout/WithTimezone) | `string` | ISO 8601 text | Yes | Yes |

These map 1:1 to SQL columns. Queries use native SQL operators (`=`, `>`, `<`, `LIKE`, `BETWEEN`, etc.).

---

## Complex Fields

| CMS Field Type | SQL Column Type | Storage Format | Searchable | Sortable |
|---|---|---|---|---|
| `rich-text` | `text` | JSON string (transform override bypasses compression) | No | No |
| `json` | `text` | JSON string (transform override bypasses compression) | No | No |
| `searchable-json` | `text` | JSON string (uncompressed by default) | Yes | Yes |
| `file` | `text` | JSON string (`{id, name, ...}`) | No | No |

These store JSON-serialized data as text. `rich-text` and `json` are not searchable, so the JSON format doesn't matter for queries. `searchable-json` is searchable — its JSON content is queried as text.

---

## Object Fields (Nested)

Object fields are **decomposed into child columns**. The parent object does not get its own column — only leaf fields do.

### Example

Model field: `address` (object) with children `city` (text) and `zip` (number).

| Entry Values | SQL Columns |
|---|---|
| `{ address: { city: "NYC", zip: 10001 } }` | `object@address__text@city = "NYC"`, `object@address__number@zip = 10001` |

### Deep Nesting (2+ Levels)

For deeply nested objects, intermediate segments are hashed to keep column names manageable:

```
address.street.number →
object@address__{hash8("object@street")}__number@number
```

The 8-char SHA-256 hash is deterministic — same path always produces the same column name.

### List-of-Objects Are Opaque Blobs

Object fields with `list: true` are **NOT decomposed**. They are stored as a single JSON column containing the entire array:

```
[{city: "NYC", zip: 10001}, {city: "LA", zip: 90001}]
→ JSON string in one column
```

**This is a fundamental limitation.** A list-of-objects can't be flattened to columns because a single entry can have 0, 1, or N items in the list — you don't know how many column sets you'd need. It's a 1-to-many relationship.

**The problem compounds with nesting.** Consider this model:

```
sections: object (list: true)
  ├── title: text
  ├── content: dynamicZone
  │     ├── hero template:
  │     │     └── heading: text
  │     └── richBlock template:
  │           └── items: object (list: true)
  │                 ├── label: text
  │                 └── value: number
  └── order: number
```

The entire structure — object list → dynamic zone → templates → nested object lists — is serialized into **one JSON column** (`object@sections`):

```json
[
  {
    "title": "Intro",
    "content": { "_templateId": "hero", "heading": "Welcome" },
    "order": 1
  },
  {
    "title": "Details",
    "content": {
      "_templateId": "richBlock",
      "items": [{"label": "A", "value": 1}, {"label": "B", "value": 2}]
    },
    "order": 2
  }
]
```

**Nothing inside this blob is filterable or sortable in SQL.** Not `sections.title`, not `sections.content.heading`, not `sections.content.items.label` — none of it.

### OpenSearch Parity Gap

**OpenSearch can filter inside list-of-objects.** It indexes nested objects and supports nested queries, meaning a query like "find entries where any section's title contains 'Intro'" works in DDB+OS but is impossible in SQL without either:

1. **JSONB queries** — dialect-specific, limited depth, poor performance at scale
2. **Separate junction tables** — a normalized relational approach (one table per list-of-objects) that would enable full SQL querying but massively increases schema complexity and join overhead
3. **Materialized search columns** — extract specific frequently-queried values into real columns at write time

This is a **parity gap** between SQL and DDB+OS. Any content model that relies on filtering within list-of-objects will have reduced query capability in SQL mode.

### Null Object Collapse

When reading back from SQL, if all child columns of an object are NULL, the object collapses to `null`:

```
object@address__text@city = NULL
object@address__number@zip = NULL
→ { address: null }  (not { address: { city: null, zip: null } })
```

---

## Dynamic Zone Fields

Dynamic zones have multiple templates, each with different fields. **All template fields are flattened into the same table.**

### Example

Dynamic zone `content` with templates:
- `hero`: `title` (text), `image` (file)
- `gallery`: `caption` (text), `columns` (number)

Creates 4 columns:
- `dynamicZone@content__text@title`
- `dynamicZone@content__file@image`
- `dynamicZone@content__text@caption`
- `dynamicZone@content__number@columns`

An entry using the `hero` template populates `title` and `image`; `caption` and `columns` are NULL. This creates sparse rows — a known and accepted tradeoff.

### Column Count

A dynamic zone with N templates averaging M fields each creates N*M columns. Three such zones with 5 templates and 10 fields each = 150 columns. This is fine — all dialects handle hundreds of columns, and NULLs are cheap.

---

## Reference Fields

Ref fields create **two columns**:

| Column | Type | Content | Purpose |
|---|---|---|---|
| `ref@author` | `text` | Full ref JSON: `{"entryId": "abc#001", "id": "abc"}` | Data storage |
| `ref@author__entryId` | `text` | Extracted entryId: `"abc"` | **Filtering** |

The companion `__entryId` column enables efficient filtering without JSON parsing:

```sql
WHERE "ref@author__entryId" = 'abc'
```

For multi-value ref fields (list), both columns store JSON arrays:
- Main: `[{"entryId": "abc#001"}, {"entryId": "def#001"}]`
- Companion: `["abc", "def"]`

---

## List Fields (multipleValues: true)

Any field type with `list: true` stores an array as a JSON string in a single column:

| Field Type | Single Value | List Value |
|---|---|---|
| `text` | `"hello"` | `'["hello","world"]'` |
| `number` | `42` | `'[1, 2, 3]'` |
| `ref` | `'{"entryId":"abc"}'` | `'[{"entryId":"abc"},{"entryId":"def"}]'` |

### Querying List Fields

Querying individual elements within a list requires dialect-specific JSONB operations:

| Dialect | Query: "list contains 'red'" |
|---|---|
| PostgreSQL | `column::jsonb @> '"red"'` |
| MySQL | `JSON_CONTAINS(column, '"red"')` |
| SQLite | `EXISTS (SELECT 1 FROM json_each(column) WHERE value = 'red')` |

See [Dialect Differences — JSONB](./dialect-differences.md#jsonb-for-list-fields) for full details.

---

## Meta Columns (System)

Every entry table has fixed meta columns that don't come from CMS field definitions:

| Column | Type | Purpose |
|---|---|---|
| `id` | string (PK) | Entry revision ID (`entryId#version`) |
| `entryId` | string (indexed) | Entry ID (shared across revisions) |
| `version` | integer | Revision number |
| `status` | string | `draft`, `published`, `unpublished` |
| `locked` | boolean | Whether revision is locked |
| `isLatest` | boolean (indexed) | Latest revision flag |
| `isPublished` | boolean (indexed) | Published revision flag |
| `tenant` | string (indexed) | Tenant ID (shared tables only) |
| `wbyDeleted` | boolean | Soft-delete (bin) flag |
| `live_version` | integer | Version number of the published revision (null if unpublished) |
| `location` | text | JSON location object |
| `location_folderId` | string | Extracted folder ID for fast filtering |
| `expiresAt` | float | Unix timestamp for TTL |

Plus identity columns (`createdBy`, `modifiedBy`, etc.) split into `_id` + full JSON text.

---

## Column Type Reference

Mapping from `FieldTypeMapper`:

| CMS Type | Knex Column Type |
|---|---|
| `text` | `string` |
| `long-text` | `text` |
| `rich-text` | `text` |
| `number` | `float` |
| `boolean` | `boolean` |
| `datetime` | `string` |
| `file` | `text` |
| `ref` | `text` |
| `ref__entryId` | `text` |
| `object` | `text` (only for list-of-objects) |
| `dynamicZone` | `text` (only for list-of-zones) |
| `json` | `text` |
| `searchable-json` | `text` |
