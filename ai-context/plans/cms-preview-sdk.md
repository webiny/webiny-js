# Plan: CMS Preview SDK & Component Mapping System

> Source PRD: `ai-context/prds/cms-preview-sdk.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Packages**: Three packages — `@webiny/cms-sdk` (core), `@webiny/cms-nextjs` (Next.js binding), and the existing `@webiny/sdk` for API calls. Mirrors the WB pattern: `website-builder-sdk` → `website-builder-react` → `website-builder-nextjs`.
- **Model schema**: `CmsModel.settings.previewUrl: string` for the preview URL. `CmsDynamicZoneTemplate.componentName: string` for the component mapping. Both exposed via the existing `getContentModel` query.
- **SDK modes**: Three modes detected automatically — `live` (production, fetches published), `preview` (drafts via `preview: true`), `editing` (iframe, receives data via postMessage). Same environment detection as WB SDK (`window.parent !== window`).
- **Bridge protocol**: Reuses the WB `Messenger` pattern — `postMessage` with origin validation and namespaced event types (e.g., `cms.preview.*`).
- **Template discriminator**: `_templateId` is the universal discriminator. No `__typename` anywhere in the SDK or rendering pipeline.
- **Entry fetching**: Uses the existing Webiny SDK's `getEntry`/`listEntries`. The SDK passes `["values.*"]` as the field selection — a new wildcard convention. The backend's `getEntry` resolver expands `values.*` to the full field selection using the model's `ValuesSelectionGenerator` (the model and AST are already available in the resolver). This means the SDK never needs to know about field types or DZ structures — it just asks for "all values" and the server handles it. `ref` fields are excluded from the generated selection.
- **Component resolution**: `_templateId` → model template definition → `componentName` → component registry lookup → render.

---

## Phase 0: Wildcard field selection (`values.*`)

**User stories**: 1

### What to build

Add support for the `values.*` wildcard in the backend's generic `getEntry`/`listEntries` resolvers. This is the foundation that lets the SDK (and any API consumer) fetch all entry values without knowing the model's field structure.

**Backend**: In the generic CMS resolver (`getEntryResolver.ts`), when the `fields` array contains `"values.*"`, expand it to `values { <full selection> }` using the model's `ValuesSelectionGenerator`. The model is already resolved in the resolver, and the `ValuesSelectionGenerator` is already a registered service. The expansion replaces the `values.*` entry in the fields array with the generated selection; other fields (like `id`, `entryId`, `createdOn`) pass through unchanged.

The same wildcard support should apply to `listEntries` as well.

**Test**: Write tests that verify:

- `values.*` expands to the correct GraphQL selection for models with scalar fields, object fields, DZ fields (with templates), and nested DZs
- Mixing `values.*` with explicit system fields (`id`, `entryId`) works correctly
- Models with no fields produce a valid (empty or minimal) selection
- The expanded query actually returns the expected entry data end-to-end (integration test via the existing CMS test infrastructure)

### Acceptance criteria

- [ ] `getEntry` resolver expands `values.*` to the full values selection using `ValuesSelectionGenerator`
- [ ] `listEntries` resolver supports the same `values.*` wildcard
- [ ] Explicit fields (`id`, `entryId`, `createdOn`) can be mixed with `values.*`
- [ ] DZ template values are returned with `_templateId` and all template fields
- [ ] Object fields and nested structures are fully expanded
- [ ] Models with no fields don't error out
- [ ] Integration tests pass for models with scalar, object, DZ, and nested DZ fields

---

## Phase 1: Model preview URL + SDK skeleton + basic entry rendering

**User stories**: 1, 4, 12, 13, 17

### What to build

The thinnest possible end-to-end slice: a CMS model gets a preview URL setting, a new SDK package can fetch and display that model's entries on a Next.js page.

**API side**: Add `previewUrl` to the `CmsModel.settings` schema. The model editor UI gets a "Preview URL" text field in the model settings area. The value is persisted and returned in `getContentModel` responses.

**SDK packages**: Create `@webiny/cms-sdk` with the core architecture — `FrontendSdk` singleton with `init(config)`, environment detection (`isClient`, `isServer`, `isEditing`), and a data provider that wraps the existing `@webiny/sdk` `CmsSdk`. The SDK always passes `["id", "entryId", "values.*"]` to `getEntry`. Create `@webiny/cms-nextjs` as a thin Next.js wrapper (headers provider, re-exports).

**Next.js demo**: A basic Next.js page fetches an entry via the SDK and renders scalar fields (title, slug, body) as plain HTML. No DZ component rendering yet — DZ values are accessible as raw data.

### Acceptance criteria

- [ ] `CmsModel.settings.previewUrl` is persisted and returned in the `getContentModel` GraphQL response
- [ ] Model editor UI has a "Preview URL" field in model settings
- [ ] `@webiny/cms-sdk` package exists with `ContentSdk.init(config)`, environment detection, and `getEntry(modelId, entryId)` that passes `["id", "entryId", "values.*"]`
- [ ] `@webiny/cms-nextjs` package exists and re-exports the core SDK with Next.js headers provider
- [ ] A Next.js page can fetch and render an entry's scalar fields without writing any GraphQL
- [ ] SDK supports `preview: true` config to fetch draft entries
- [ ] SDK works in both SSR and client-side contexts

---

## Phase 2: Component registration + bridge discovery

**User stories**: 2, 3, 5, 20

### What to build

The component catalog system: frontend developers register components with the SDK, and the CMS model editor discovers them via an iframe bridge.

**SDK side**: Add `createComponent(ReactComponent, manifest)` factory (mirrors WB's pattern). Add `ComponentRegistry` that stores registered components. When the SDK detects editing mode (iframe), it establishes a `Messenger` connection and sends `cms.preview.component.register` messages for each registered component — including name, label, and input definitions.

**Admin side**: The DZ template editing dialog gets a "Component" picker. When the model has a `previewUrl`, the dialog opens a hidden iframe to that URL. The bridge receives component registrations and populates the picker dropdown. The user selects which component renders this template.

**Per-route scoping**: Components are passed to the SDK's entry renderer (like WB's `DocumentRenderer` receiving `components` prop), so each route can declare its own component catalog.

### Acceptance criteria

- [ ] `createComponent(Component, manifest)` creates a component blueprint with name, label, and input definitions
- [ ] Components are registered with the SDK and sent to the CMS editor via the bridge when in editing mode
- [ ] The DZ template editor shows a "Component" dropdown populated from the bridge-discovered catalog
- [ ] Only components registered on the preview URL page for that model appear in the picker
- [ ] Component discovery happens live — adding a new component on the frontend and refreshing the iframe makes it appear immediately

---

## Phase 3: Component mapping storage + DZ rendering

**User stories**: 6, 9, 10, 14, 16

### What to build

Store the template→component mapping and render DZ entries as actual React components.

**API side**: Add `componentName: string` to `CmsDynamicZoneTemplate`. When the user selects a component in the template editor (Phase 2), the `componentName` is saved on the template. It's returned as part of the model definition in `getContentModel`.

**SDK side**: Add `ComponentResolver` that takes entry data and the model definition, iterates DZ values, reads `_templateId`, looks up the template to get `componentName`, resolves it in the `ComponentRegistry`, and renders the matched React component with the template's field values as props.

**Entry renderer**: Add `<EntryRenderer entry={entry} model={model} components={components} />` React component. It renders DZ field values as mapped components. Scalar fields are passed through as-is for the developer's layout to consume.

### Acceptance criteria

- [ ] `CmsDynamicZoneTemplate.componentName` is persisted and returned in model definition queries
- [ ] SDK fetches model definition and builds the `_templateId` → `componentName` mapping automatically
- [ ] `<EntryRenderer>` renders DZ template values as the mapped React components
- [ ] Components receive the template's field values as props/inputs
- [ ] Scalar fields (title, slug, etc.) are accessible on the entry object for manual rendering
- [ ] `_templateId` is the only discriminator used — no `__typename` dependency
- [ ] Nested DZ fields (DZ inside a DZ template) resolve correctly

---

## Phase 4: Live preview in iframe

**User stories**: 7, 8, 11, 19

### What to build

Real-time live preview: the CMS entry editor embeds the preview URL in an iframe and pushes form data on every change.

**Admin side**: The entry editor detects that the model has a `previewUrl` and embeds it in a preview pane (side-by-side layout, similar to the existing `extensions/livePreview/` pattern). On every form field change, the editor sends the full entry data to the iframe via `cms.preview.entry.update` postMessage.

**SDK side**: The `EditingSdk` variant listens for `cms.preview.entry.update` messages and updates its internal entry state. The `<EntryRenderer>` reactively re-renders when the entry data changes. For models without DZ fields, the developer's layout still receives updated scalar field values.

**Data flow**: Editor form data → postMessage → SDK EditingSdk → reactive state update → `<EntryRenderer>` re-render. Full entry sent on every change (not patches).

### Acceptance criteria

- [ ] CMS entry editor embeds the preview URL iframe when the model has a `previewUrl`
- [ ] Every form field change sends the full entry data to the iframe via postMessage
- [ ] The SDK receives live updates and re-renders the entry in real time
- [ ] DZ template components update live as the user edits template field values
- [ ] Scalar field changes (title, slug) propagate to the preview immediately
- [ ] Models without DZ fields still get live preview of scalar fields
- [ ] The preview pane shows a side-by-side layout (editor + preview)

---

## Phase 5: Component input definitions in template editor

**User story**: 15

### What to build

When a component is mapped to a template, the template editor displays the component's input definitions so the content modeler understands what the component expects.

**Admin side**: After the user selects a component in the template editor's component picker, the dialog shows a read-only summary of the component's declared inputs — name, label, description, type. This helps the modeler understand whether the template's fields align with what the component needs.

### Acceptance criteria

- [ ] Template editor shows the mapped component's input definitions (name, label, description) after selection
- [ ] Input definitions are sourced from the component manifest received via the bridge
- [ ] The display is read-only and informational — no editing of component inputs from the CMS side

---

## Phase 6: Reference field hooks

**User story**: 18

### What to build

Explicit SDK utilities for developers to fetch referenced entries where auto-fetching doesn't cover them.

**SDK side**: Provide hooks or methods (e.g., `useEntryRef(refValue)` or `sdk.resolveRef(refValue)`) that take a ref field value (`{ entryId, modelId }`) and fetch the referenced entry using the SDK's data provider. This gives developers control over when and how references are resolved, without the SDK attempting recursive auto-fetching.

### Acceptance criteria

- [ ] SDK provides a method to resolve a ref field value to a full entry
- [ ] The method uses the same SDK config (preview mode, auth) as the main entry fetching
- [ ] Developers can call the ref resolver explicitly in their component code
- [ ] The ref resolver works in all three SDK modes (live, preview, editing)
