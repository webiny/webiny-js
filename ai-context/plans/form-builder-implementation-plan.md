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
  errors: FormError[];        // { path, label, message }[]
  isDirty: boolean;
  isValid: boolean | null;    // null = not yet validated
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

---

## Phase 1: Render a Form with Layout

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
- `FieldBuilder` base class with fluent API: `.label()`, `.placeholder()`, `.schema()`, `.defaultValue()`, `.renderer()`, `.hidden()`
- `TextFieldBuilder` — registered as `fields.text()`
- `SelectFieldBuilder` — registered as `fields.select()`, with `.options()` (static array)
- Mutable builders: each method mutates `this`, returns `this`

**Validation:**

- `.schema(zodSchema)` on field builder
- `field.validation` — `{ isValid: boolean | null, message?: string }`
- `form.validate()` — async, runs all schemas via `safeParseAsync()`, populates errors, returns `Promise<boolean>`
- `form.submit()` — validates, returns `Promise<T | false>`
- `form.isValid` — computed, `boolean | null`
- `form.errors` — flat list `{ path, label, message }[]`
- `validateOnSubmit: true` — no per-field validation until first submit, then validate on every `setValue()`

**Field VM:**

- `field.vm` getter — `{ name, type, label, placeholder, value, validation, disabled, renderer, options, onChange }`
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

- `CreatePagePresenter` — creates FormModel via factory with `title` (required), `path` (required), `pageType` (`.hidden()`, defaultValue `"staticPage"`)
- `CreatePageView` — reads `presenter.vm`, renders `<FormView>`, submit button
- Replaces existing `CreatePage.tsx` / `CreatePageWizard` which uses `useBind()` from `@webiny/form`
- Wired to existing `CreatePage` use case / gateway for actual page creation

**Tests:**

- `FormModel.test.ts` — field creation, `setValue`/`getValue`, `getData`, `setData`, `isDirty`, `reset`, validation, `submit()`, error population
- `FieldBuilder.test.ts` — fluent API produces correct field configuration

**End state:** The real "Create a Page" dialog works with FormModel + `<FormView>`. Type in values, click Create, validation runs, `getData()` returns `{ pageType: "staticPage", title: "...", path: "..." }`.

---

## Phase 2: Value Transformations

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

## Phase 3: Modifiers + Language Field

External code contributes fields and behavior to the form.

**Deliverables:**

- `FormModifier` interface: `{ modify(form: FormModel): void }`
- `form.fields(fields => ({ ... }))` — merges new fields into existing form's Map
- `form.field("existingField").disabled(value)` — set disabled state
- `form.field("existingField").beforeChange(fn)` / `.afterChange(fn)` — append to existing pipelines
- `FormModelFactory` enriched with rule evaluators (prepared for Phase 7, but factory wiring is here)

**Build the Language modifier:**

- `AddLanguageModifier` adds `language` select field with `afterChange` that nudges path
- Appends `beforeChange` on path field for language prefix
- Feature flag check before applying

**Update the Presenter:**

- Inject modifiers via DI
- Apply modifiers after base form creation: `for (const mod of this.modifiers) mod.modify(this.form)`

**Update the View:**

- Language dropdown renders automatically via `<FormView>` when the field exists in the layout

**Tests:**

- Modifier adds field, field appears in `getData()` and `form.vm`
- Modifier appends `beforeChange` to existing field, pipeline chains correctly
- Feature flag off → modifier is no-op

**End state:** With feature flag on: Language dropdown appears. Select German, type "Demo" → path is "/de/demo". Change language to English → path becomes "/en/demo". Change title → path updates with language prefix preserved.

---

## Phase 4: Page Type Providers + Form Rebuild

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

### Phase 5: Layout System Expansion
- `layout.separator()`, `layout.tabs()`, `layout.object()`, `layout.element()`
- Layout node types and field name resolution (dot-notation paths, relative names inside `layout.object()`)
- Rules on layout elements (tabs containers, individual tabs)
- Rule cascading from layout elements to fields
- Tab `hasErrors` computed from referenced fields
- `ObjectNode` rendering for single objects and non-templated lists

### Phase 6: Object & List Fields
- `ObjectField` with hierarchical children Map
- `.fields()` on object builder for nesting
- `.list()` modifier with stable item keys (internal, not data)
- `addItem()`, `removeItem(index)`
- List validation via `.listSchema()`
- `hasErrors` rollup over descendants

### Phase 7: Rules System
- Rule format: `{ type, target, operator, value, action }`
- `ConditionRuleEvaluator` (built-in, reads form values)
- `RuleEvaluator` interface + `AccessControlRuleEvaluator` (injected via factory)
- Unknown rule types ignored with dev console warning
- `field.vm.visible` and `field.vm.disabled` as MobX computeds resolving full rule cascade
- Integrate evaluators into `FormModelFactory`

### Phase 8: Dynamic Zones / Templates
- `.templates()` on object fields
- `_templateId` discriminator
- Template visibility and layouts
- `layout.object("field", { templateId: [...] })` for per-template layouts

### Phase 9: CMS Model Conversion
- `createFormFromCmsModel(model)` converter
- Type mapping, validator-to-zod bridge
- Layout generation from CMS `layout` grid
- `factory.createFromCmsModel()` integration

### Phase 10: Advanced Validation
- Async validation debouncing (default 300ms, configurable per field via `.debounce()`)
- Async schema memoization (cache by input value, force-revalidate on `submit()`)
- `field.vm.validating` flag (true while `parseAsync()` in-flight)

### Phase 11: Advanced Features
- `requiredWhen()` — conditional required
- `computed()` / `computedUntilDirty()` — derived fields
- Reactive `.options(() => ...)` — MobX computed options
- `.extend()` for object field merging
- Form-level `addRule()` — zod refinements and imperative rules
- `form.layout()` (append) and `form.setLayout()` (replace)
