# FormModel Implementation Plan

## Target: "Create a Page" Dialog

The MVP is validated when the existing "Create a Page" dialog is replaced end-to-end with the FormModel:

- Page type selector (external to form, triggers full form replacement)
- Hidden `pageType` field (included in `getData()`)
- Title field (required, `afterChange` generates path)
- Path field (required, `beforeChange` applies slugify)
- Language field (added via modifier from translations package, `afterChange` nudges path)
- Product field (added via ProductPageProvider, disables title/path)
- Form rebuild on page type change with value preservation
- Submit → `getData()` returns all values

Each phase produces a working, renderable form in the browser. No phase is "model only" — every phase ends with visible output.

---

## Architectural Decisions

These decisions were resolved during design review and apply across all phases.

**Package & location:** `@webiny/app-admin`, at `app-admin/src/features/formModel/`.

**MobX:** `makeAutoObservable(this, {}, { autoBind: true })` — follows existing codebase pattern.

**Field storage:** Hierarchical `Map<string, Field>`. FormModel holds a top-level Map of root fields. Each `ObjectField` owns its children's Map. `form.field("a.b.c")` is sugar that walks the tree: `root.get("a").children.get("b").children.get("c")`.

**Layout controls rendering order.** Field renderers are leaf-only (text, select, etc.). Object/list nesting is handled by the layout renderer via `ObjectNode`, not by field renderers. Object/dynamic-zone rendering details deferred to post-MVP.

**Callbacks receive root FormModel.** `beforeChange((value, form) => ...)` and `afterChange((value, form) => ...)` always receive the root FormModel as the second argument. Developer navigates to the field they need.

**`submit()` returns `Promise<T | false>`.** Returns data if valid, `false` if validation fails. Errors are already populated on `form.errors` and per-field VMs via MobX reactivity.

**Field builders are mutable.** Each fluent method mutates `this` and returns `this`, matching the CMS `FieldBuilder` pattern.

**Async from day one.** `validate()` returns `Promise<boolean>`, `submit()` returns `Promise<T | false>`. Internally uses `safeParseAsync()` (Zod 4 is already in app-admin). Debouncing/memoization deferred to when async validators with API calls actually land.

**FormModel owns `form.vm`.** The VM is a computed getter on FormModel. Presenter forwards `form.vm` to the view — no Presenter-level VM construction for form state.

**`form.vm` shape:**

```ts
interface FormVM {
  layout: LayoutNodeVM[];
  errors: FormError[]; // { path, label, message }[]
  isDirty: boolean;
  isValid: boolean | null; // null = not yet validated
}
```

**Hidden fields via `.hidden()`.** A builder method, not a renderer hint. Hidden fields are excluded from layout (including default layout generation), included in `getData()` and validation.

**Renderer registry is a prop.** `<FormView form={form.vm} renderers={renderers} />`. A `defaultFieldRenderers` object is exported with standard `@webiny/admin-ui` wrappers. Consumers spread and override. Later wired via `AdminConfig.Form.FieldRenderer`.

**`isDirty` is value-based only.** Compares current values against `setData()` baseline. No sticky "touched" flags. Field-level `isDirty` is the same — simple value comparison. Drives navigation guards/confirmation dialogs.

**Orphan field warning.** If a layout is explicitly defined, fields not in the layout and not marked `.hidden()` produce a dev console warning nudging the developer to add them to the layout or mark `.hidden()`.

**Field builder registry:** Proxy + Map of factories + module augmentation per field type, same as CMS `FieldBuilderRegistry`. Enables type-safe `fields.text()` autocomplete and extensibility.

**Recursion guard in `setValue()`:**

```
setValue(raw):
  transformed = runBeforeChange(raw)
  if (transformed === this.value) return  // guard
  this.value = transformed
  runAfterChange(transformed)
```

`beforeChange` always runs (pure transform). `afterChange` (side effects) only fires when value actually changed.

**`setData()` ignores unknown fields.** Only defined fields are hydrated. `getData()` returns all defined fields including hidden and defaults.

**Default layout generation.** If no `layout` is provided, one row per field in definition order (Map insertion order). Hidden fields excluded.

**`FormModelFactory` from Phase 1.** Presenters always use `this.formFactory.create({...})`. Factory is a trivial pass-through initially, enriched with rule evaluators in Phase 3.

**Real dialog replacement.** Tracer bullet hits the real "Create a Page" dialog. New Presenter + View replace the existing `useBind()`-based implementation.

**Testing: pure data unit tests.** FormModel is pure TypeScript + MobX. No React rendering tests. Co-located test files (`*.test.ts`).

**Form rebuild is full replacement.** `setPageType()` reads `getData()`, creates a new FormModel via factory, calls `setData()` on the new form. Presenter swaps the `form` reference. MobX reactivity handles re-render.

**`PageTypeProvider` is a Presenter-level concept.** It's a page builder abstraction, not a FormModel concept. FormModel only sees `modify(form)` calls. The Presenter orchestrates: create base → apply page type provider → apply cross-cutting modifiers.

**Modifier ordering is irrelevant.** All modifiers run during construction (before render). Pipelines (`beforeChange`/`afterChange`) execute at runtime when `setValue()` is called, by which point all modifiers have contributed their handlers.

**Type-narrowed field access via `.as()`.** `form.field("name")` returns a base FieldBuilder with common ops. `.as("object")` narrows to type-specific builder (e.g., `.fields()` on object). Throws in dev if type doesn't match.

**Field replace and remove.** `fields.replace().text()...` replaces a field entirely. `fields.remove()` removes a field. Both operate on the field map.

**Layout positional modifiers.** Layout nodes support `.before("target")`, `.after("target")`, `.replace("target")`, `layout.remove("target")`. Target is a field ID or tab ID; first match in tree order wins.

**Layout node access via `form.layout("nodeId")`.** `form.layout()` has two overloads: callback form appends nodes, string form accesses a named layout node. Named nodes (e.g., tabs with `id`) are narrowed via `.as("tabs")` for type-specific mutations. Tabs handle exposes `.tab({...})` to add and `.tab("id")` to access existing tabs.

**Tabs are layout-only.** Tabs are purely visual grouping in the layout tree. Not in the field map, no data in `getData()`. Modifiers target tabs via `form.layout("nodeId").as("tabs")`, not via `form.field()`.

**`.required()` is a first-class field concept.** Separate from zod schemas. Checks for empty values (null, undefined, empty string) before the schema runs. Exposes `field.vm.required: boolean` for renderer required indicators. Works without `.schema()`. Validation order: required check → zod schema → form-level rules. `.requiredWhen()` (Phase 11) adds conditional required via MobX computed.

---

## Phase 1: [x] Render a Form with Layout

A FormModel with fields, validation, a layout system, and a generic `<FormView>` that renders it. Replaces the existing "Create a Page" dialog.

**FormModel (`app-admin/src/features/formModel/`):**

- `FormModel` class (MobX `makeAutoObservable(this, {}, { autoBind: true })`)
- Hierarchical `Map<string, Field>` for field storage
- `FormModelFactory` — trivial pass-through, registered in DI
- `form.field("name")` accessor (supports dot-notation: `form.field("a.b")`)
- `field.setValue(value)` / `field.getValue()`
- `form.getData()` — returns plain object from all defined fields
- `form.setData(data)` — hydrates fields, ignores unknown fields, resets dirty baseline
- `form.reset()` — reverts to `setData()` snapshot
- `form.isDirty` — computed, value-based comparison against baseline
- `form.vm` — computed getter exposing `{ layout, errors, isDirty, isValid }`

**Field Builders:**

- `FieldBuilderRegistry` — Proxy + factory Map + module augmentation (CMS pattern)
- `FieldBuilder` base class with fluent API: `.label()`, `.placeholder()`, `.schema()`, `.defaultValue()`, `.renderer()`, `.hidden()`, `.required(message)`
- `TextFieldBuilder` — registered as `fields.text()`
- `SelectFieldBuilder` — registered as `fields.select()`, with `.options()` (static array or `form => Option[]` reactive function)
- Mutable builders: each method mutates `this`, returns `this`

**Validation:**

- `.required(message)` — first-class field concept, checks empty before zod schema runs. Exposes `field.vm.required: boolean`.
- `.schema(zodSchema)` on field builder — for shape/format validation beyond "not empty"
- Validation order: required check → zod schema
- `field.validation` — `{ isValid: boolean | null, message?: string }`
- `form.validate()` — async, runs required checks then schemas via `safeParseAsync()`, populates errors, returns `Promise<boolean>`
- `form.submit()` — validates, returns `Promise<T | false>`
- `form.isValid` — computed, `boolean | null`
- `form.errors` — flat list `{ path, label, message }[]`
- `validateOnSubmit: true` — no per-field validation until first submit, then validate on every `setValue()`

**Field VM:**

- `field.vm` getter — `{ name, type, label, placeholder, value, validation, required, disabled, renderer, options, onChange }`
- `onChange` is a closure: `(value) => field.setValue(value)`
- `validation.isValid` is `boolean | null` (tri-state)

**Layout System (Phase 1 subset):**

- `layout.row(...fieldIds)` — the only layout node type in Phase 1
- Default layout generation: one row per non-hidden field in definition order
- `form.vm.layout` — resolved layout tree with field VMs embedded in `RowNodeVM`
- Orphan field dev console warning (field defined but not in layout and not `.hidden()`)

**React View:**

- `<FormView form={form.vm} renderers={renderers} />` — generic renderer that walks layout nodes
- `LayoutNodeRenderer` — dispatches by `node.type` (only `row` in Phase 1)
- Field renderer registry: `renderers` prop, plain object `Record<string, React.FC<{ field: FieldVM }>>`
- `defaultFieldRenderers` export with `text` and `select` renderers wrapping `@webiny/admin-ui` `<Input>` and `<Select>`
- Lookup order: `{type}:{renderer}` → `{type}`

**CreatePage integration:**

- `CreatePagePresenter` — creates FormModel via factory with `title` (`.required()`), `path` (`.required()`), `pageType` (`.hidden()`, defaultValue `"staticPage"`)
- `CreatePageView` — reads `presenter.vm`, renders `<FormView>`, submit button
- Replaces existing `CreatePage.tsx` / `CreatePageWizard` which uses `useBind()` from `@webiny/form`
- Wired to existing `CreatePage` use case / gateway for actual page creation

**Tests:**

- `FormModel.test.ts` — field creation, `setValue`/`getValue`, `getData`, `setData`, `isDirty`, `reset`, validation, `submit()`, error population
- `FieldBuilder.test.ts` — fluent API produces correct field configuration

**End state:** The real "Create a Page" dialog works with FormModel + `<FormView>`. Type in values, click Create, validation runs, `getData()` returns `{ pageType: "staticPage", title: "...", path: "..." }`.

---

## Phase 2: [x] Value Transformations

Title auto-generates path. Path applies slugify.

**Deliverables:**

- `.beforeChange(fn)` — transforms value before storing. Chainable (left-to-right pipe). Receives `(value, form)`, returns transformed value. Runs only on `setValue()`, NOT on `setData()`.
- `.afterChange(fn)` — side effect after value stored. Chainable. Receives `(value, form)`, returns void. Runs only on `setValue()`, NOT on `setData()`.
- Recursion guard in `setValue()`: `beforeChange` always runs, `afterChange` only fires if transformed value differs from current (`===`).
- `afterChange` calling `setValue()` on other fields triggers their full pipelines.
- Append support: `form.field("name").beforeChange(fn)` / `.afterChange(fn)` for later use by modifiers.

**Update the form:**

- Title gets `afterChange` that sets path (developer handles "should I update" logic — e.g., only if path is empty)
- Path gets `beforeChange(slugify)`

**Tests:**

- `beforeChange` pipeline runs in order, transforms value
- `afterChange` fires after store, receives transformed value
- Recursion guard stops cycles
- `setData()` does NOT trigger `beforeChange`/`afterChange`
- Cross-field `afterChange` → `setValue()` triggers target field's pipeline

**End state:** Type "Hello World" in title → path auto-fills with "hello-world". Manually edit path → title changes no longer overwrite it (developer logic). Submit still works.

---

## Phase 3: [x] Modifiers + Language Field

External code contributes fields and behavior to the form.

**Deliverables:**

- `FormModifier` interface: `{ modify(form: FormModel): void }`
- `form.fields(fields => ({ ... }))` — merges new fields into existing form's Map
- `fields.replace().text()...` — replace an existing field entirely
- `fields.remove()` — remove a field from the form
- `form.field("existingField").disabled(value)` — set disabled state
- `form.field("existingField").beforeChange(fn)` / `.afterChange(fn)` — append to existing pipelines
- `form.field("name").as("type")` — type-narrowed field access (throws in dev if type doesn't match)
- Layout positional modifiers: `.before("target")`, `.after("target")`, `.replace("target")`, `layout.remove("target")`
- `FormModelFactory` enriched with rule evaluators (prepared for Phase 7, but factory wiring is here)

**Build the Language modifier:**

- `AddLanguageModifier` adds `language` select field with `afterChange` that nudges path
- Appends `beforeChange` on path field for language prefix
- Uses `form.layout(layout => [layout.row("language").after("path")])` for positional insertion
- Feature flag check before applying

**Update the Presenter:**

- Inject modifiers via DI
- Apply modifiers after base form creation: `for (const mod of this.modifiers) mod.modify(this.form)`

**Update the View:**

- Language dropdown renders automatically via `<FormView>` when the field exists in the layout

**Tests:**

- Modifier adds field, field appears in `getData()` and `form.vm`
- Modifier appends `beforeChange` to existing field, pipeline chains correctly
- `fields.replace()` replaces an existing field
- `fields.remove()` removes a field from the form and `getData()`
- Layout positional modifiers insert at correct positions
- Feature flag off → modifier is no-op

**End state:** With feature flag on: Language dropdown appears. Select German, type "Demo" → path is "/de/demo". Change language to English → path becomes "/en/demo". Change title → path updates with language prefix preserved.

---

## Phase 4: [x] Page Type Providers + Form Rebuild

Different page types reconfigure the form. Switching types rebuilds it.

**Deliverables:**

- `PageTypeProvider` abstraction (Presenter-level, not FormModel): `{ name, label, icon?, modify(form: FormModel): void }`
- `StaticPageProvider` — no-op (base form is sufficient)
- `ProductPageProvider` — adds product picker field, disables title/path, `afterChange` on product sets title/path
- Presenter `buildForm(pageType)` method: create base via factory → apply page type provider's `modify()` → apply cross-cutting modifiers
- `setPageType(type)` — reads `getData()`, builds new form, restores common values via `setData()`

**Update the Presenter:**

- Page type selector in Presenter VM (not a form field — it controls the form)
- `pageType` hidden field carries the value in `getData()`
- `onPageTypeChange` triggers full form replacement

**Update the View:**

- Page type dropdown at top (rendered from Presenter VM, not from `<FormView>`)
- `<FormView>` below re-renders automatically when Presenter swaps `form` reference

**Tests:**

- `buildForm()` applies correct page type provider
- `setPageType()` preserves common field values across rebuild
- Cross-cutting modifiers apply to all page types
- `getData()` includes `pageType` from hidden field

**End state:** Full working dialog matching all four screenshots:

1. Static Page: Title + Path (+ Language if enabled)
2. Dropdown shows all registered page types
3. Product Page: Product picker + disabled Title/Path
4. Static Page + German: "/de/demo" path generation

---

## Future Phases (post-MVP)

### Phase 5: [x] Layout System Expansion

- `layout.separator()`, `layout.tabs()`, `layout.object()`, `layout.element()`
- Named tabs containers: `layout.tabs({ id: "settings", tabs: [...] })`
- `TabDefinition.description` for tab description text
- `form.layout("nodeId")` — access named layout nodes for mutation
- `form.layout("nodeId").as("tabs")` — type-narrowed layout access (`.tab({...})` to add, `.tab("id")` to access existing tabs, `.tab("id").layout(...)` to append)
- Layout node types and field name resolution (dot-notation paths, relative names inside `layout.object()`)
- Rules on layout elements (tabs containers, individual tabs)
- Rule cascading from layout elements to fields
- Tab `hasErrors` computed from referenced fields
- `ObjectNode` rendering for single objects and non-templated lists

### Phase 6: [x] Object & List Fields

- `ObjectField` with hierarchical children Map
- `.fields()` on object builder for nesting
- `.list()` modifier with stable item keys (internal, not data)
- `addItem()`, `removeItem(index)`
- List validation via `.listSchema()`
- `hasErrors` rollup over descendants

### Phase 7: [x] Rules System

- Rule format: `{ type, target, operator, value, action }`
- `ConditionRuleEvaluator` (built-in, reads form values)
- `RuleEvaluator` interface + `AccessControlRuleEvaluator` (injected via factory)
- Unknown rule types ignored with dev console warning
- `field.vm.visible` and `field.vm.disabled` as MobX computeds resolving full rule cascade
- Integrate evaluators into `FormModelFactory`

### Phase 8: [ ] Dynamic Zones / Templates

Broken into sub-phases. All implemented.

#### Phase 8a: [x] Single-object templates

- `.templates([{ id, name, fields, visible? }])` on object fields
- `_templateId` discriminator in `getData()` / `setValueSilent()`
- Reactive template `visible` callback filters the picker (does not clear active selection)
- Atomic add/remove — users pick one template at a time; no piecemeal field edits inside a template
- Active template can be cleared via `field.onChange(null)` (generic field API — no dedicated "unset template" method)
- Build-time validation: rejects duplicate template ids, reserved `_templateId`, combining `.fields()` with `.templates()`, and combining `.list()` with `.templates()` (deferred to 8b)
- `DynamicZoneRenderer` — visual parity with the CMS `SingleValueDynamicZone` (gallery dialog with template cards + active template inside an accordion with delete action + confirmation)
- `ObjectRenderer` delegates to `DynamicZoneRenderer` when `isTemplated && !isList`
- Demo route at `/form-model-demo` (app-admin) with a proper Presenter

#### Phase 8b: [x] List templates (dynamic zones)

- Allow `.list().templates([...])` — each list item carries its own `_templateId`
- Add-item flow: user picks a template from the gallery → new item is appended with that template's children
- Per-item delete/duplicate/move preserved from Phase 6 list behaviour
- Visual parity with CMS `MultiValueDynamicZone` (one accordion per item, template icon/name in the header, action row with up/down/duplicate/delete)
- `IObjectFieldItemVM.templateId` is already typed — needs to be populated and respected by the renderer

#### Phase 8c: [x] Per-template layouts

- `layout.object("field", { templateId: [...] })` — each template can define its own row layout
- `layout.object("field", layout)` — non-templated objects also accept a single inner layout, applied to the single object or to every list item
- Falls back to default one-field-per-row when a template has no layout entry, or when no `layout.object()` is registered
- Layout lives on the parent form (not inside the template definition) so layout concerns stay centralised
- Layouts surface on the field VM as `field.vm.layout` (single) and `item.layout` (list items); object/dynamic-zone renderers consume these via a `<NestedLayout>` walker
- **Limitation (deferred to a later phase):** `layout.object()` calls nested inside another object's inner layout are not registered. Templated children do not exist until a template is activated, so eager registration is not possible at build time. The nested node still resolves as a cell (default layout); a dev console warning fires when the nesting is detected.

#### Phase 8c.1: [x] Nested object layouts

- Register `layout.object()` recursively when nested inside another object's inner layout
- For non-templated parents, recurse against the parent's children Map
- For templated parents, defer registration until `setTemplate()` activates a template, then walk that template's layout for any nested `object` nodes and register on the freshly-built children
- Apply the same flow to non-templated lists (each item gets the same recursive registration on creation)
- Replaces the dev-warning emitted in Phase 8c

#### Phase 8d: [x] Modifier API + orphan handling

- `form.field("x").as("object").templates.add(...)` / `.templates.remove(...)` — modifier-facing API for adding/removing whole templates after the form is built
- Orphan layout map entries (templates removed but still referenced in `layout.object("field", { templateId: [...] })`) are ignored silently
- Dev warning suppression for orphan objects/lists (they auto-render per 4c default-layout fallback)
- Tests covering: add/remove template at runtime, orphan layout entries, orphan warning suppression, interaction with active template (removing the active template clears it via `onChange(null)`)

#### Phase 8e: [x] Integration + real-world verification

- Default field renderers for object/list items with template picker (`@webiny/admin-ui`) — exercised against the existing `/form-model-demo` playground rather than a fresh integration target

### Phase 9: [ ] CMS Model Conversion

- `createFormFromCmsModel(model)` converter
- Type mapping, validator-to-zod bridge
- Layout generation from CMS `layout` grid
- `factory.createFromCmsModel()` integration

### Phase 10: [ ] Advanced Validation

- Async validation debouncing (default 300ms, configurable per field via `.debounce()`)
- Async schema memoization (cache by input value, force-revalidate on `submit()`)
- `field.vm.validating` flag (true while `parseAsync()` in-flight)

### Phase 11: [x] Advanced Features

- `.requiredWhen(fn, message)` — conditional required via MobX computed callback, reactively flips `field.vm.required`
- `.requiredWhen` can be added by a modifier (chains additively; first truthy callback wins; built-in `.required()` is non-overridable)
- `computed()` / `computedUntilDirty()` — derived fields, can be added by a modifier (`field.setComputed`/`setComputedUntilDirty`); fields stay editable, participate in validation
- `form.field("name").as("object").fields(factory)` for runtime children management on existing object fields (add/replace/remove via the same factory shape as `form.fields()`); throws on templated objects, propagates additions to existing list items
- Form-level `addRule()` — accepts a Zod schema (validated against `getData()`) or an imperative function returning `IFormError[]`; matched paths surface on per-field validation
- `form.setLayout()` — full layout replacement (re-registers object node inner layouts, propagates ancestor rules, re-emits orphan warnings)
