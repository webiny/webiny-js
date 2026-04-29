# Storage Converter Tests

This directory contains comprehensive tests for the Headless CMS storage converter system. The converters handle bidirectional transformation between plain field values and their storage representation.

## Overview

The storage converter system transforms field values from their plain format (as seen in GraphQL/API) to their storage format (as stored in DynamoDB/Elasticsearch) and vice versa. Each field type has specific storage prefixes (e.g., `text@fieldId`, `object@fieldId`, `dynamicZone@fieldId`).

## Test Structure

All tests follow the same pattern:

1. **Plain Value** - The human-readable format with actual field names
2. **Converted Value** - The storage format with type prefixes and storage IDs
3. **Model Definition** - The field schema defining the structure
4. **Bidirectional Test** - Validates both `convertToStorage` and `convertFromStorage`

### Example Pattern

```typescript
const plainValue = {
  profile: {
    name: "John Doe"
  }
};

const convertedValue = {
  "object@profileId": {
    "text@nameId": "John Doe"
  }
};
```

## Test Organization

Tests are organized by nesting patterns and field types:

### 1. Simple Fields (`/converters/`)

- Single value: `text.test.ts`, `number.test.ts`, etc.
- Multiple values: `text.multiple.test.ts`, `number.multiple.test.ts`, etc.
- Tests root-level fields without any object wrapping

### 2. Object + Field (`/converters/object/{fieldType}/`)

- Pattern: `object.field` → `profile.name`
- Tests single object containing a field
- Both single and multiple value variants

### 3. Nested Objects (`/converters/object/object/`)

- Pattern: `object.object.field` → `profile.settings.isActive`
- Tests 2-level object nesting
- Files named: `object.{fieldType}.test.ts`

### 4. Multiple Objects (`/converters/multipleObject/`)

- Pattern: `multipleObject.field` → `profiles[].name`
- Tests arrays of objects
- Files named: `multipleObject.{fieldType}.test.ts`

### 5. Object + Multiple Object + Object (`/converters/object/multipleObject/object/`)

- Pattern: `object.multipleObject.object.field` → `profile.settings[].config.name`
- Tests: single object → array of objects → single nested object → field
- 4 levels deep

### 6. Object + Multiple Object + Multiple Object (`/converters/object/multipleObject/multipleObject/`)

- Pattern: `object.multipleObject.multipleObject.field` → `profile.settings[].configs[].name`
- Tests: single object → array of objects → array of nested objects → field
- 4 levels deep

### 7. Dynamic Zones (`/converters/dynamicZone/`)

- Pattern: `dynamicZone.field` → `content._templateId` + `content.title`
- Tests dynamic zones with various field types
- Each template can have different fields
- Special `_templateId` field identifies which template is active

### 8. Dynamic Zone + Object (`/converters/dynamicZone/`)

- `dynamicZone.object.test.ts` - Single object with multiple fields
- `dynamicZone.multipleObject.test.ts` - Multiple objects with fields
- `dynamicZone.objectMixed.test.ts` - Both single and multiple objects

### 9. Object + Dynamic Zone (`/converters/object/dynamicZone/`)

- Pattern: `object.dynamicZone.field` → `profile.content._templateId` + `profile.content.title`
- Tests object wrapping a dynamic zone
- All field types including nested objects

### 10. Complex Nested (`/converters/object/dynamicZone/object.dynamicZone.complex.test.ts`)

- **Most comprehensive test** - all combinations in one test
- Structure: object → multiple DZs → single/multiple objects → nested DZs → fields
- 4+ levels deep with multiple templates
- Demonstrates real-world complex content structures

## Field Types Tested

All tests cover these field types (both single and multiple values where applicable):

- `text` - Short text strings
- `number` - Numeric values
- `boolean` - True/false values
- `datetime` - ISO 8601 datetime strings
- `file` - File URLs
- `long-text` - Long text content
- `rich-text` - HTML rich text
- `json` - JSON objects
- `ref` - References to other entries
- `searchable-json` - Searchable JSON data
- `object` - Nested object structures
- `dynamicZone` - Dynamic content zones with templates

## Storage ID Convention

Storage IDs follow the pattern: `{type}@{fieldId}`

Examples:

- `text@nameId` - Text field named "name"
- `object@profileId` - Object field named "profile"
- `dynamicZone@contentId` - Dynamic zone field named "content"
- `number@ageId` - Number field named "age"

## Running Tests

```bash
# Run all converter tests
yarn test packages/api-headless-cms/__tests__/converters/ -- --storage=ddb

# Run specific pattern tests
yarn test packages/api-headless-cms/__tests__/converters/object/ -- --storage=ddb

# Run single test file
yarn test packages/api-headless-cms/__tests__/converters/text.test.ts -- --storage=ddb
```

## Adding New Tests

When adding new field types or nesting patterns:

1. **Follow the naming convention**: `{pattern}.{fieldType}[.Multiple].test.ts`
2. **Use the mocks**: `createModel()` and `createModelField()` from `mocks/`
3. **Test bidirectionally**: Always validate both `convertToStorage` and `convertFromStorage`
4. **Include plain and converted values**: Define both expected formats
5. **Update TESTS.md**: Add your new test pattern to the list

## Key Helper Files

- `__helpers/converters.js` - `getConverters()` function to initialize converters
- `mocks/model.js` - `createModel()` to build test models
- `mocks/field.js` - `createModelField()` to build field definitions

## Notes for AI Agents

- **Pattern Recognition**: File paths indicate nesting depth (e.g., `/object/multipleObject/object/` = 3 levels)
- **Naming Convention**: File names describe the exact pattern tested
- **Complex Test**: Start with `object.dynamicZone.complex.test.ts` for comprehensive example
- **Storage Format**: Always includes type prefix (e.g., `text@`, `object@`)
- **Template ID**: Dynamic zones always have `_templateId` at the root of their value
- **Bidirectional**: Every test validates conversion in both directions

## Common Patterns

### Simple Object Field

```typescript
plainValue: { profile: { name: "John" } }
convertedValue: { "object@profileId": { "text@nameId": "John" } }
```

### Multiple Objects

```typescript
plainValue: { profiles: [{ name: "John" }, { name: "Jane" }] }
convertedValue: { "object@profilesId": [{ "text@nameId": "John" }, { "text@nameId": "Jane" }] }
```

### Dynamic Zone

```typescript
plainValue: { content: { _templateId: "textTemplate", title: "Hello" } }
convertedValue: { "dynamicZone@contentId": { _templateId: "textTemplate", "text@titleId": "Hello" } }
```

### Nested Objects in Dynamic Zone

```typescript
plainValue: {
    profile: {
        content: {
            _templateId: "template1",
            settings: { name: "Config" }
        }
    }
}
convertedValue: {
    "object@profileId": {
        "dynamicZone@contentId": {
            _templateId: "template1",
            "object@settingsId": { "text@nameId": "Config" }
        }
    }
}
```

## Testing Philosophy

- **Exhaustive Coverage**: Test all field types at each nesting level
- **Real-world Patterns**: Complex test demonstrates actual usage scenarios
- **Maintainability**: Consistent naming and structure across all tests
- **Bidirectional Validation**: Ensures data integrity in both directions
- **Type Safety**: Uses TypeScript for model definitions and assertions
