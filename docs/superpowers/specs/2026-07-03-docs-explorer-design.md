# Docs Explorer — GraphQL Playground

## Overview

A schema documentation explorer for the custom GraphQL Playground (`packages/app-graphql-playground`). Users can browse types, fields, arguments, and enums from the introspected schema in a navigable, searchable side panel.

## Decisions

- **Layout:** Right-side `Drawer` from `@webiny/admin-ui`, non-modal (`modal={false}`), toggled from the toolbar.
- **Architecture:** Separate `DocsExplorerPresenter` (DI abstraction), decoupled from `PlaygroundPresenter`. Follows the 3-layer presenter pattern.
- **Schema scope:** Per-endpoint. The docs panel shows the schema for the active tab's endpoint.
- **Interaction:** Read-only reference. No click-to-insert into the query editor.
- **Search:** Case-insensitive substring match on type names, root view only.

## Schema Model

The presenter transforms the raw `__schema` introspection JSON into a navigable structure.

### Data

- **Type map:** `Map<string, SchemaType>` built from `__schema.types`, excluding built-in types (names starting with `__`).
- **Root types:** Resolved from `__schema.queryType`, `__schema.mutationType`, `__schema.subscriptionType`.
- **SchemaType fields:** `name`, `kind`, `description`, `fields[]` (with `args[]` and return `type`), `inputFields[]`, `enumValues[]`, `interfaces[]`, `possibleTypes[]`.
- **Null normalization:** GraphQL introspection returns `null` (not `[]`) for kind-inapplicable fields (e.g. `fields: null` on a SCALAR, `inputFields: null` on an OBJECT). The presenter must coerce `null` to `[]` when building the type map.

### Navigation

A stack of type names (`string[]`). The last entry is the current view. Empty stack = root view.

- Push: clicking a type name. If the type already exists in the stack, pop back to that occurrence instead of pushing a duplicate (handles cyclic schemas like `User > Post > User`).
- Pop: back button.
- Clear: clicking the root breadcrumb.

## DocsExplorerPresenter

### Abstraction

File: `presentation/DocsExplorer/abstractions.ts`

```ts
interface IDocsExplorerPresenter {
    readonly vm: IDocsExplorerVm;
    toggle(): void;
    setSchema(schema: Record<string, any> | null, status: "idle" | "loading" | "ready"): void;
    navigateToType(name: string): void;
    navigateBack(): void;
    navigateToRoot(): void;
    setSearchQuery(query: string): void;
}
```

### View Model

```ts
interface IDocsExplorerVm {
    open: boolean;
    schemaStatus: "idle" | "loading" | "ready";
    searchQuery: string;
    breadcrumbs: string[];
    currentView: IDocsRootView | IDocsTypeView | null;
}

interface IDocsRootView {
    kind: "root";
    sections: IDocsRootSection[];
    filteredTypes: IDocsTypeSummary[];
}

interface IDocsRootSection {
    name: string;
    fields: IDocsFieldVm[];
}

type IDocsGraphQLTypeKind = "OBJECT" | "INPUT_OBJECT" | "ENUM" | "UNION" | "INTERFACE" | "SCALAR";

interface IDocsTypeSummary {
    name: string;
    typeKind: IDocsGraphQLTypeKind;
    description: string | null;
    isNavigable: boolean;
}

interface IDocsTypeView {
    kind: "type";
    name: string;
    description: string | null;
    typeKind: IDocsGraphQLTypeKind;
    fields: IDocsFieldVm[];
    inputFields: IDocsInputFieldVm[];
    enumValues: IDocsEnumValueVm[];
    possibleTypes: IDocsTypeRef[];
    interfaces: IDocsTypeRef[];
}

interface IDocsEnumValueVm {
    name: string;
    description: string | null;
}

interface IDocsInputFieldVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    defaultValue: string | null;
}

interface IDocsFieldVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    args: IDocsArgVm[];
}

interface IDocsArgVm {
    name: string;
    description: string | null;
    type: IDocsTypeRef;
    defaultValue: string | null;
}

interface IDocsTypeRef {
    name: string;
    displayName: string;
    isNavigable: boolean;
}
```

### Implementation

File: `presentation/DocsExplorer/DocsExplorerPresenter.ts`

- MobX `makeAutoObservable`.
- No dependencies (no DI injections). Receives schema via `setSchema()`.
- `displayName` on `IDocsTypeRef` handles wrapping types: unwraps the `NON_NULL` / `LIST` nesting from introspection to produce strings like `[String!]!`. `name` holds the underlying named type (for navigation).

### DI Wiring

File: `presentation/DocsExplorer/feature.ts`

Wires `DocsExplorerPresenter` abstraction to `DocsExplorerPresenterImpl`. No dependencies.

## Components

All under `presentation/DocsExplorer/components/`.

### DocsExplorerDrawer

The shell component.

- Uses `<Drawer>` from `@webiny/admin-ui` with `modal={false}`, `side="right"`.
- Controlled by `docsPresenter.vm.open` via `open` / `onOpenChange`.
- Header: back button (when `breadcrumbs.length > 0`) + breadcrumb trail.
- Body rendering based on `vm.currentView` and `vm.schemaStatus`:
  - `schemaStatus === "loading"` and `currentView === null`: loading spinner with "Loading schema..." text.
  - `schemaStatus === "idle"` and `currentView === null`: neutral placeholder — "No schema available."
  - `currentView.kind === "root"`: delegates to `DocsRootView`.
  - `currentView.kind === "type"`: delegates to `DocsTypeView`.
- Receives the full `DocsExplorerPresenter` as a prop.

### DocsRootView

Root landing page.

- Search input at the top (bound to `presenter.setSearchQuery`).
- When search is empty: shows sections for Query, Mutation, Subscription (only if present in schema), each listing their fields.
- When search is non-empty: shows a flat filtered list of matching types with kind badges.
- Type names are clickable (calls `presenter.navigateToType`), except scalars which have no detail view.

### DocsTypeView

Detail view for a single type.

- Displays: type name, kind badge, description.
- **OBJECT:** field list with args and return types.
- **INPUT_OBJECT:** input field list with types and default values (rendered via `inputFields`, not `fields`).
- **ENUM:** list of enum values with descriptions.
- **UNION / INTERFACE:** list of possible types.
- **OBJECT implementing interfaces:** list of interfaces.
- Type references are rendered via `DocsTypeRef`.

### DocsTypeRef

Inline component for a type reference.

- Renders the `displayName` (e.g., `[String!]!`).
- Clickable — calls `presenter.navigateToType(ref.name)`.
- Scalars are not clickable (no detail view) and are excluded from `navigateToType`. All other types (objects, inputs, enums, unions, interfaces) are clickable.
- `IDocsTypeRef` carries a `isNavigable: boolean` flag so components can conditionally render as a link or plain text.

## Toolbar Integration

A "Docs" toggle button is added to `PlaygroundToolbar.tsx`. `PlaygroundToolbarProps` gains a `docsPresenter: DocsExplorerPresenter.Interface` prop, passed by `PlaygroundPage`. The button calls `docsPresenter.toggle()` and shows an active state when `docsPresenter.vm.open` is true.

## Wiring in PlaygroundPage

`PlaygroundPage` resolves `DocsExplorerFeature` via `useFeature`. It passes `docsPresenter` to `DocsExplorerDrawer` and `PlaygroundToolbar`.

A `useEffect` watches `presenter.vm.schema` and `presenter.vm.schemaStatus` and calls `docsPresenter.setSchema(schema, schemaStatus)` when they change, passing the authoritative status directly.

This requires `PlaygroundPresenter` to expose its introspection state: add `schemaStatus: "idle" | "loading" | "ready"` to `IPlaygroundVm`, backed by the existing private `pendingIntrospections` set and the `schemas` map. States: `"idle"` = no endpoint or no introspection attempted, `"loading"` = introspection in flight, `"ready"` = schema cached. Error handling for failed introspections (adding an `"error"` state) is out of scope for this feature — a failed introspection will present as `"idle"`.

## Search Behavior

- Case-insensitive substring match on type names.
- Operates only at the root view.
- When search query is non-empty, root sections (Query/Mutation/Subscription) are replaced by a flat filtered type list.
- Navigating to a type clears the search query.
- No debounce — synchronous `Array.filter` over in-memory types.

## Testing

Unit tests for `DocsExplorerPresenter`:

- `setSchema` builds the type map and root view correctly.
- Navigation: push, pop, root reset.
- Search: filters types, cleared on navigation.
- `toggle` opens/closes.
- Wrapping type display: `NON_NULL(LIST(NON_NULL(String)))` renders as `[String!]!`.
- Schema change resets navigation stack and search.
- Null/empty schema produces `currentView: null`.
- Cyclic navigation: navigating to a type already in the stack pops back to it instead of pushing a duplicate.
- `schemaStatus` reflects `"idle"` (no schema set), `"loading"` (introspection in progress), `"ready"` (schema available).
- `INPUT_OBJECT` types expose `inputFields`, not `fields`.

File: `__tests__/DocsExplorerPresenter.test.ts`

## Files to Create

```
packages/app-graphql-playground/src/
  presentation/DocsExplorer/
    abstractions.ts                  # abstraction + namespace + vm types
    DocsExplorerPresenter.ts         # implementation
    feature.ts                       # DI wiring
    index.ts                         # re-export
    components/
      DocsExplorerDrawer.tsx         # Drawer shell
      DocsRootView.tsx               # root view with search
      DocsTypeView.tsx               # type detail view
      DocsTypeRef.tsx                # inline type reference

packages/app-graphql-playground/__tests__/
  DocsExplorerPresenter.test.ts      # unit tests
```

## Files to Modify

```
packages/app-graphql-playground/src/
  presentation/Playground/
    abstractions.ts                  # add schemaStatus to IPlaygroundVm
    PlaygroundPresenter.ts           # expose schemaStatus from pendingIntrospections/schemas
    components/PlaygroundToolbar.tsx  # add Docs toggle button, accept docsPresenter prop
    components/PlaygroundPage.tsx     # resolve DocsExplorerFeature, wire schema, render drawer
  index.tsx                          # register DocsExplorerFeature
```
