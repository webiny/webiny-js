# Deep Root Search for GraphQL Docs Explorer

## Problem

The docs explorer search only matches type names. Searching "title" won't find `CmsArticle` even though it has a `title` field. Users must manually browse types to find fields, args, and enum values.

## Design

Expand the root-level search to match against all named elements inside every type:

- Type names (existing)
- Field names (OBJECT, INTERFACE)
- Argument names (within fields)
- Input field names (INPUT_OBJECT)
- Enum value names (ENUM)

All matching is case-insensitive substring (`includes`).

### VM Change

Add `matchContext: string | null` to `IDocsTypeSummary`. When a type matches by name, `matchContext` is null. When it matches by an internal element, `matchContext` describes the first match — e.g. `"field: title"`, `"arg: limit"`, `"enum: PUBLISHED"`.

### Presenter Change

In `buildRootView()`, replace the name-only filter with a function that walks each type's fields, args, inputFields, and enumValues. On first match, record the match context and include the type. Short-circuit after the first match per type for performance.

### UI Change

In `TypeSummaryRow`, render `matchContext` as a small gray annotation after the kind badge.

### What doesn't change

- Search input stays on root view only (no per-type-view filtering)
- `setSearchQuery` API unchanged
- Navigation, breadcrumbs, type view rendering all untouched
- Root sections (Query/Mutation field lists) still hidden during search — matching fields surface through their parent type in `filteredTypes`
