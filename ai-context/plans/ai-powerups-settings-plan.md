# AI Powerups Settings — Implementation Plan

## Overview

Build the AI Powerups settings dialog: a named dialog with a tabbed form, headless features for loading/saving settings via GraphQL, and a plugin-based `AiPowerupsSettingsGroup` system that lets packages register their own settings tabs. The General group (with model presets as a list) requires FormModel Phase 6 (Object & List fields) as a prerequisite.

## Decisions

These decisions were resolved during the grill session and apply across all phases.

**API is out of scope.** Gateways call `getSettings` / `updateSettings` / `listModels` GraphQL endpoints and assume they work. Stub responses in gateways where needed.

**Settings shape:** `Record<string, any>` keyed by group name. Example: `{ general: { presets: [...] }, seo: { title: "...", noIndex: false } }`. Each `AiPowerupsSettingsGroup` owns the top-level key matching `group.name`.

**`AiPowerupsSettingsGroup` lives in `admin/presentation/`.** It's a presentation-layer extension point.

**FormModel Phase 6 is a prerequisite.** The General group needs `.object().fields(...).list()` for presets. Phase 6 is implemented first inside `app-admin/src/features/formModel/`.

**Shared settings cache:** Follow the feature pattern (abstraction + `registerInstance()` in a shared feature), but use a MobX observable object — not `ListCache` — since settings is a single object.

**Dialog has no params.** Use `useOpenDialog()` / `useDialog()` without a Zod schema. Params are `Record<string, unknown>` (effectively unused).

**Model dropdown:** Stub `listModels` gateway with dummy model strings. The local feature for loading models lives inside the presentation folder (not reusable).

---

## Phase 1: Headless Features — GetSettings & UpdateSettings

Build the data layer: shared cache, get/update features, gateways.

**Location:** `packages/ai-powerups/src/admin/features/`

### Shared cache

`features/settings/shared/abstractions.ts`:

- `SettingsCache` abstraction — wraps a MobX observable `{ data: Record<string, any> | null }`
- Interface: `{ get(): Record<string, any> | null; set(data: Record<string, any>): void; }`

`features/settings/shared/feature.ts`:

- `SharedSettingsFeature` — registers the cache instance via `registerInstance()`

### GetSettings feature

`features/settings/getSettings/`:

| File                       | Responsibility                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `abstractions.ts`          | `GetSettingsUseCase`, `GetSettingsRepository`, `GetSettingsGateway` abstractions                            |
| `GetSettingsUseCase.ts`    | Thin wrapper — calls repository                                                                             |
| `GetSettingsRepository.ts` | Check cache → call gateway → update cache → return                                                          |
| `GetSettingsGateway.ts`    | GQL query: `{ aiPowerups { getSettings { data error { message code data } } } }`. Uses `MainGraphQLClient`. |
| `feature.ts`               | `GetSettingsFeature` — wires DI. Repository + Gateway in singleton scope.                                   |
| `index.ts`                 | Re-exports                                                                                                  |

### UpdateSettings feature

`features/settings/updateSettings/`:

| File                          | Responsibility                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `abstractions.ts`             | `UpdateSettingsUseCase`, `UpdateSettingsRepository`, `UpdateSettingsGateway` abstractions                                                                            |
| `UpdateSettingsUseCase.ts`    | Calls repository with settings data                                                                                                                                  |
| `UpdateSettingsRepository.ts` | Call gateway → on success, update shared cache → return                                                                                                              |
| `UpdateSettingsGateway.ts`    | GQL mutation: `mutation UpdateSettings($data: JSON!) { aiPowerups { updateSettings(data: $data) { data error { message code data } } } }`. Uses `MainGraphQLClient`. |
| `feature.ts`                  | `UpdateSettingsFeature` — wires DI. Repository + Gateway in singleton scope.                                                                                         |
| `index.ts`                    | Re-exports                                                                                                                                                           |

### Composite feature

`features/settings/feature.ts`:

- `SettingsFeature` — registers `SharedSettingsFeature`, `GetSettingsFeature`, `UpdateSettingsFeature`

### Wire into admin Extension

`admin/Extension.tsx`:

- Import and register `SettingsFeature` in the admin feature tree

### End state

Both use cases are injectable. `GetSettingsUseCase.execute()` returns `Record<string, any>`. `UpdateSettingsUseCase.execute(data)` saves and updates the cache. No UI yet — this is data-only.

---

## Phase 2: Named Dialog + Skeleton Presenter

Wire up the named dialog, a skeleton presenter that loads settings, and the dialog shell (no form yet).

**Location:** `packages/ai-powerups/src/admin/presentation/`

### Named dialog registration

`presentation/AiPowerupsSettingsConfig.tsx`:

- Register `<AdminConfig.Dialog name="ai-powerups-settings" element={<AiPowerupsSettingsDialog />} />`
- Export `AI_POWERUPS_SETTINGS_DIALOG` constant

### Open dialog hook

`presentation/useAiPowerupsSettingsDialog.ts`:

- `useAiPowerupsSettingsDialog()` — uses `useOpenDialog()` (no schema), returns a function that calls `openDialog("ai-powerups-settings", {})`

### Replace alert in Extension.tsx

`admin/Extension.tsx:17`:

- Replace `alert("Open AI Powerups")` with the hook-based dialog opener

### Skeleton presenter

`presentation/AiPowerupsSettingsPresenter.ts`:

- MobX observable class with `makeAutoObservable`
- Injects `GetSettingsUseCase`, `UpdateSettingsUseCase`
- `init()` — loads settings via `GetSettingsUseCase`, stores in local state
- `vm` getter exposes `{ loading, settings, error }`
- `save(data)` — calls `UpdateSettingsUseCase`
- Registered as a presentation-level feature via `createFeature`

### Dialog component

`presentation/AiPowerupsSettingsDialog.tsx`:

- `observer` component
- Uses `useDialog()` (no schema) for `closeDialog`
- Uses `useFeature(AiPowerupsSettingsFeature)` for the presenter
- Calls `presenter.init()` in `useEffect`
- Renders `<Dialog>` shell with title "AI Powerups Settings", cancel + save buttons
- Shows `<OverlayLoader>` while loading
- Body is empty placeholder for now

### End state

Click the settings menu item → dialog opens → loads settings from the (mocked) API → shows a dialog shell with cancel/save buttons. No form content yet.

---

## Phase 3: AiPowerupsSettingsGroup Abstraction + Tabbed Form

Build the settings group extension point, the presenter's form-building logic, and the tabbed form rendering.

### SettingsGroup abstraction

`presentation/abstractions.ts`:

```ts
export interface IAiPowerupsSettingsGroup {
  name: string;
  label: string;
  description?: string;
  icon?: JSX.Element;
  buildForm(formBuilder: AiPowerupsSettingsGroup.FormBuilder): void;
}

export namespace AiPowerupsSettingsGroup {
  export interface FormBuilder {
    fields(
      fn: (
        fields: FormModelFactory.FieldBuilderRegistry
      ) => Record<string, FormModelFactory.FieldBuilder>
    ): void;
    layout(fn: (layout: FormModelFactory.LayoutBuilder) => LayoutNode[]): void;
  }
  export type Interface = IAiPowerupsSettingsGroup;
}

export const AiPowerupsSettingsGroup = createAbstraction<IAiPowerupsSettingsGroup>(
  "AiPowerups/SettingsGroup"
);
```

### Presenter form-building

Update `AiPowerupsSettingsPresenter`:

- Inject `[AiPowerupsSettingsGroup, { multiple: true }]` and `FormModelFactory`
- `buildForm()` method that:
  1. Iterates all injected groups
  2. Calls `group.buildForm(builder)` to collect fields and layout per group
  3. Constructs a single `FormModel` via factory with:
     - Top-level fields: one object field per group (keyed by `group.name`) wrapping the group's fields
     - Layout: `layout.tabs(...)` with one tab per group, each containing the group's layout
  4. Calls `form.setData(settings)` with the loaded settings
- `vm` getter now exposes `{ loading, form: IFormVM, error }`
- `save()` calls `form.submit()` → if valid, passes data to `UpdateSettingsUseCase`

### Dialog update

Update `AiPowerupsSettingsDialog.tsx`:

- Render `<FormView form={vm.form} />` inside the dialog body
- Show `vm.errors` above the form (validation errors banner)
- Save button calls `presenter.save()`
- On successful submit, close dialog

### End state

Dialog opens with a tabbed form. Each registered `AiPowerupsSettingsGroup` shows as a tab. Form validates on submit, errors display above the form. Successful save closes the dialog.

**Note:** No groups are registered yet, so the form is empty. That's fine — the skeleton is complete and ready for groups to plug in.

---

## Phase 4: FormModel Phase 6 — Object & List Fields

Implement Phase 6 of the FormModel implementation plan. This is a prerequisite for the General settings group which needs `.object().fields(...).list()` for presets.

**Location:** `packages/app-admin/src/features/formModel/`

### 4a: ObjectFieldBuilder + ObjectField

**abstractions.ts changes:**

- `IObjectFieldConfig extends IFieldConfig` — adds `childBuilders: Record<string, IFieldBuilder>`, `isList: boolean`, `listSchema?: z.ZodTypeAny`
- `IObjectField extends IField` — adds `children: Map<string, IField>`, `getData(): Record<string, unknown>`
- `IListField extends IObjectField` — adds `items: IListItemField[]`, `addItem(): void`, `removeItem(index: number): void`
- `IListItemField` — field-like accessor for a single list item with its own children
- Add `object: IObjectField` and `list: IListField` to `FieldTypeMap`
- `IObjectNodeVM` — add to `LayoutNodeVM` union: `{ type: "object", fieldId: string, label?: string, layout: LayoutNodeVM[] }`
- `IListNodeVM extends IObjectNodeVM` — adds `items: IListItemVM[]`, where each item has `{ key: string, layout: LayoutNodeVM[], remove: () => void }`
- Add `.object()` to `ILayoutBuilder` and `ILayoutModifier`

**FieldBuilder.ts changes:**

- `ObjectFieldBuilder extends FieldBuilder<"object">`:
  - `.fields(fn: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>)` — defines child fields
  - `.list()` — marks as a list field, returns `this` (or a narrowed `ListFieldBuilder`)
  - `.listSchema(schema: z.ZodTypeAny)` — list-level validation
  - Default renderer: `"object"` (or `"list"` when `.list()` is called)
  - `build(name)` returns `IObjectFieldConfig`
- Register `object` factory in `createFieldBuilderRegistry()`
- Module-augment `IFieldBuilderRegistry` to add `object(): IObjectFieldBuilder`

**ObjectField.ts (new file):**

- `ObjectField extends Field` — hierarchical field with children `Map<string, Field>`
- Constructor receives `IObjectFieldConfig`, creates child `Field` instances
- `getValue()` returns a plain object assembled from children (or array for list mode)
- `setValueSilent(data)` hydrates children from object/array
- `validate()` recurses into children, collects errors with dot-path names
- For list mode: `items` is an observable array of `{ key: string, children: Map<string, Field> }`
- `addItem()` creates a new item from child builders, assigns a stable key (internal counter, not exposed in data)
- `removeItem(index)` removes by position

### 4b: FormModel integration

**FormModel.ts changes:**

- `field("a.b.c")` — walk the tree: split on `.`, traverse `ObjectField.children`
- `getData()` — delegate to `ObjectField.getValue()` for object fields (recursive)
- `setData()` — delegate to `ObjectField.setValueSilent()` for nested data
- `validate()` — recurse into `ObjectField.validate()`, collect errors with dot-paths
- `isDirty` — delegate to `ObjectField` for deep comparison
- `_resolveLayoutNode` case `"object"` — implement `_resolveObjectNode()`:
  - For non-list: resolve child layout into `IObjectNodeVM`
  - For list: resolve per-item layouts into `IListNodeVM` with `items[]`
- `_collectFieldIdsFromLayout` — add `"object"` case (collect from `node.layout` recursively)
- `_nodeMatchesTarget` — add `"object"` case (match by `node.fieldId`)
- `_removeFromLayout` — add `"object"` case
- Add `object(fieldId, options?)` to `layoutAPI`, `_createModifierLayoutAPI`

### 4c: Renderers

**FormView.tsx changes:**

- `LayoutNodeRenderer` — add `"object"` case dispatching to `ObjectNodeRenderer`
- `ObjectNodeRenderer` — renders the child layout (recurse into `LayoutNodeRenderer`)
- `ListNodeRenderer` — renders items with add/remove controls, each item renders its child layout

**DefaultFieldRenderers.tsx changes:**

- Register `"object"` and `"list"` default renderers (these are fallback field-level renderers; the layout-level rendering is in `FormView.tsx`)

### 4d: Tests

- Object field: create, `getData()` returns nested object, `setData()` hydrates, validation recurses
- List field: `addItem()`, `removeItem()`, `getData()` returns array, validation over items
- `form.field("parent.child")` dot-notation traversal
- Layout with object node resolves correctly
- `isDirty` detects nested changes
- `hasErrors` rollup through object fields in tabs

### End state

FormModel supports `fields.object().fields(...).list()`. Can create, validate, and render nested object and list fields. The "General" settings group can now use this for presets.

---

## Phase 5: General Settings Group

Build the General settings group with model presets (list of name + model + apiKey).

**Location:** `packages/ai-powerups/src/admin/presentation/`

### Local feature: ListModels

`presentation/features/listModels/`:

- `abstractions.ts` — `ListModelsUseCase`, `ListModelsRepository`, `ListModelsGateway`
- `ListModelsGateway.ts` — GQL query to `aiPowerups.listModels`. **Stub response:** return `["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001", "gpt-4o", "gpt-4o-mini"]`
- `ListModelsRepository.ts` — simple pass-through (no cache needed, it's local/ephemeral)
- `ListModelsUseCase.ts` — calls repository
- `feature.ts` — wires DI, all singleton scope

### GeneralSettingsGroup

`presentation/groups/GeneralSettingsGroup.ts`:

- Implements `AiPowerupsSettingsGroup.Interface`
- `name = "general"`, `label = "General"`
- Injects `ListModelsUseCase` (or the resolved models list)
- `buildForm(form)`:
  - `form.fields(fields => ({ presets: fields.object().label("Presets").fields(f => ({ name: f.text().label("Name").required(), model: f.select().label("Model").options(modelOptions).required(), apiKey: f.text().label("API Key").required() })).list() }))`
  - `form.layout(layout => [ layout.row("presets") ])` — or however the object/list renders in the layout

### Registration

- Register `GeneralSettingsGroup` as an `AiPowerupsSettingsGroup` implementation in the presentation feature
- Register `ListModelsFeature` in the same feature

### Model options loading

The presenter (or the GeneralSettingsGroup itself) needs to load models asynchronously. Options:

- Use a MobX reaction in the group or presenter that populates the select field's options once models are loaded
- Similar pattern to `AddLanguageModifier.ts` which uses a reaction to watch for data loading

### End state

The settings dialog has a "General" tab with a presets list. Users can add/remove presets, each with name, model (dropdown), and API key. Form validates all presets on submit. Settings round-trip through get → edit → save.

---

## Phase Summary

| Phase | What                                                  | Where                             | Depends on  |
| ----- | ----------------------------------------------------- | --------------------------------- | ----------- |
| 1     | Headless features (get/update settings, shared cache) | `ai-powerups/admin/features/`     | —           |
| 2     | Named dialog + skeleton presenter                     | `ai-powerups/admin/presentation/` | Phase 1     |
| 3     | SettingsGroup abstraction + tabbed form building      | `ai-powerups/admin/presentation/` | Phase 2     |
| 4     | FormModel Phase 6 (Object & List fields)              | `app-admin/features/formModel/`   | —           |
| 5     | General settings group with presets list              | `ai-powerups/admin/presentation/` | Phases 3, 4 |

Phases 1–3 and Phase 4 are independent tracks that can be worked in parallel. Phase 5 requires both tracks to be complete.
