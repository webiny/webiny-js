# FormModel Brainstorming

## Problem

The current `packages/form` package starts and ends in React. `<Form>`, `<Bind>`, `useBind` — all form building, state, validation, and field registration is driven by the React component tree. This conflicts with the 3-layer observable architecture (Presenter/Repository/Gateway) where React should be a dumb view layer reacting to a ViewModel.

Current pain points:

- Form state lives inside React, not in the Presenter.
- Field registration happens via `<Bind>` mounting — the form doesn't know about fields until React renders them.
- Conditional visibility is JSX-driven (`{condition && <Bind>}`).
- onChange/value pipelines, validation timing, cross-field logic — all baked into React.
- List fields (arrays of objects) require manual index path building (`` `metaTags.${index}.name` ``), `DynamicFieldset` component, etc.

## Goal

A `FormModel` class in pure TypeScript that:

- Is owned by the Presenter (not React).
- Defines all fields, validation, visibility, and behavior declaratively.
- Uses MobX for observable state.
- Uses zod for validation schemas.
- Exposes a `vm` for the view — React just renders it.
- Follows the same fluent builder pattern as the Headless CMS `ModelBuilder` (`packages/api-headless-cms/src/features/modelBuilder/fields/**`).
- Serves both manual forms (developer-defined via fluent builder) and CMS-driven forms (auto-generated from `CmsModelField[]`) through the same construction API.

## Reference Architecture

### 3-Layer Pattern (example: `packages/app-website-builder/src/presentation/navigation/NextjsConfig/`)

```
abstractions.ts    -> Interfaces + Abstraction tokens (Presenter, Repository, Gateway)
Presenter          -> owns state (MobX), exposes `vm` getter, orchestrates
Repository         -> holds domain data, calls gateway
Gateway            -> talks to external world (GraphQL)
feature.ts         -> DI registration (Presenter transient, Repository/Gateway singleton)
View.tsx           -> dumb React view, reads presenter.vm, done
```

### CMS Field Builder Pattern (example: `packages/api-file-manager/src/domain/file/file.model.ts`)

```ts
model.fields(fields => ({
    name: fields.text().label("Name").required("Value is required."),
    size: fields.number().label("Size").required("Value is required."),
    tags: fields.text().label("Tags").list().required("Value is required."),
    metadata: fields.object().label("Metadata").fields(fields => ({
        image: fields.object().label("Image").fields(fields => ({ ... }))
    }))
}));
```

Key elements:

- `FieldBuilder` base class with fluent API (label, help, placeholder, renderer, defaultValue, tags, etc.)
- Type-specific builders (`TextFieldBuilder`, `NumberFieldBuilder`, etc.) with type-specific validators.
- `FieldBuilderRegistry` — Proxy-based, so `fields.text()` / `fields.number()` / `fields.object()` are factory methods.
- `.list()` is a modifier on any field type — flips cardinality from singular to plural.
- `.fields(fields => (...))` on `ObjectFieldType` for nesting.
- Module augmentation per field type for TypeScript autocomplete on the registry.
- Validator mixin interfaces (`RequiredValidator`, `MinLengthValidator`, etc.).

## Design Decisions

### FormModelFactory

The `FormModelFactory` is registered in DI and pre-configures every FormModel instance with standard rule evaluators and cross-cutting concerns. Presenters never wire evaluators manually.

```ts
interface FormModelFactory {
  create<T>(config: FormModelConfig<T>): FormModel<T>;
  createFromCmsModel(model: CmsModel): FormModel;
}
```

Implementation — wired once in the DI module:

```ts
class FormModelFactoryImpl implements FormModelFactory {
  constructor(
    private identity: IdentityContext,
    private featureFlags: FeatureFlagService
    // ... any other context needed by evaluators
  ) {}

  create<T>(config: FormModelConfig<T>): FormModel<T> {
    return new FormModel<T>({
      ...config,
      ruleEvaluators: this.buildEvaluators()
    });
  }

  createFromCmsModel(model: CmsModel): FormModel {
    const form = createFormFromCmsModel(model);
    form.setRuleEvaluators(this.buildEvaluators());
    return form;
  }

  private buildEvaluators(): RuleEvaluator[] {
    return [
      new AccessControlRuleEvaluator(this.identity),
      new FeatureFlagRuleEvaluator(this.featureFlags)
      // future evaluators added here — one place, all forms benefit
    ];
  }
}
```

Presenter usage — one line for either path:

```ts
// Manual form
class SettingsPresenter {
  constructor(private formFactory: FormModelFactory) {
    this.form = this.formFactory.create({
      fields: fields => ({
        title: fields.text().label("Title")
      })
    });
  }
}

// CMS-driven form
class EntryPresenter {
  constructor(
    private formFactory: FormModelFactory,
    private getModel: GetModel.Interface
  ) {}

  async init(modelId: string) {
    const model = await this.getModel.execute(modelId);
    this.form = this.formFactory.createFromCmsModel(model);
  }
}
```

New rule evaluator types are added in the factory — every form in the system picks them up automatically. The factory is also the natural place for any other cross-cutting form concerns that emerge later: default debounce settings, global validation messages, locale-aware formatters.

### Field Definition

Fields are defined in the Presenter via a fluent builder, not by mounting React components:

```ts
this.form = formFactory.create<PageSettings>({
  validateOnSubmit: true, // default; false = validate on every onChange
  fields: fields => ({
    title: fields
      .text()
      .label("Page Title")
      .placeholder("Enter page title")
      .schema(z.string().min(1, "Title is required")),

    slug: fields
      .text()
      .label("Slug")
      .beforeChange(slugify)
      .schema(
        z
          .string()
          .min(1, "Slug is required")
          .refine(async value => {
            const exists = await api.slugExists(value);
            return !exists;
          }, "Already taken")
      ),

    metaTags: fields
      .object()
      .label("Meta Tags")
      .list()
      .fields(fields => ({
        name: fields.text().label("Name").schema(z.string().min(1, "Name is required")),
        content: fields.text().label("Content").schema(z.string().min(1, "Content is required"))
      }))
      .listSchema(z.array().max(20, "Maximum 20 meta tags"))
  }),
  layout: layout => [
    layout.row("title", "slug"),
    layout.object("metaTags", [layout.row("name", "content")])
  ]
});
```

### Rules System

Rules control field and layout element behavior at runtime. They are defined in JSON format and can be applied to fields and layout elements (tabs containers, individual tabs). The same rule shape is used everywhere.

#### Rule Format

```ts
interface Rule {
  type: "accessControl" | "condition";
  target: string; // "identity" for access control, fieldId for conditions
  operator: string; // "matches", "isEmpty", "eq", etc.
  value: string | null;
  action: "hide" | "disable";
}
```

Two rule types:

| Type            | Evaluated against                              | Reactivity                                                                 |
| --------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `accessControl` | Current user identity (teams, ID, permissions) | Static per session (evaluated once, or reactive if identity is observable) |
| `condition`     | Form field values                              | Reactive — re-evaluates on every field change via MobX                     |

Two actions, targeting different layers:

| Action    | Effect                                                                                        |
| --------- | --------------------------------------------------------------------------------------------- |
| `hide`    | Layout: don't render the slot. Field: exclude from validation.                                |
| `disable` | Field VM: `disabled: true` → renderer passes to Design System component (`<Input disabled>`). |

#### Rules on Fields

```json
{
  "fieldId": "apiKey",
  "rules": [
    {
      "type": "accessControl",
      "target": "identity",
      "operator": "matches",
      "value": "team:all-users",
      "action": "disable"
    },
    {
      "type": "condition",
      "target": "image",
      "operator": "isEmpty",
      "value": null,
      "action": "hide"
    }
  ]
}
```

#### Rules on Layout Elements

Rules on tabs containers and individual tabs use the same format:

```json
{
  "type": "tabs",
  "label": "Settings",
  "id": "42kkifr9",
  "rules": [
    {
      "type": "condition",
      "target": "title",
      "operator": "isEmpty",
      "value": null,
      "action": "disable"
    }
  ],
  "tabs": [
    {
      "id": "q9zgr8fj",
      "label": "Tab 1",
      "rules": [
        {
          "type": "condition",
          "target": "apiKey",
          "operator": "isEmpty",
          "value": null,
          "action": "disable"
        }
      ],
      "layout": [["6mr4pfth"]]
    }
  ]
}
```

#### Rule Cascading

Rules cascade from parent layout elements to children:

- If a **tabs container** has `action: "hide"` → the entire container is hidden, all tabs and their fields are hidden and excluded from validation.
- If a **tabs container** has `action: "disable"` → all fields in all tabs are disabled, regardless of individual tab or field rules.
- If an **individual tab** has `action: "hide"` → that tab is hidden, its fields are hidden and excluded from validation. Other tabs unaffected.
- If an **individual tab** has `action: "disable"` → all fields in that tab are disabled. Other tabs unaffected.
- If a **field** has `action: "hide"` → that specific field is hidden and excluded from validation.
- If a **field** has `action: "disable"` → that specific field is disabled.

A field's resolved state is computed from all levels:

```ts
field.disabled = field's own disable rules
             OR parent tab's disable rules
             OR parent tabs container's disable rules

field.visible = field's own hide rules (none active)
            AND parent tab visible
            AND parent tabs container visible
```

#### Rule Evaluator Registry

The FormModel delegates rule evaluation to pluggable evaluators. `condition` rules are evaluated by a built-in evaluator that reads form values. `accessControl` rules (and any future rule types) are evaluated by external evaluators injected via the `FormModelFactory`.

```ts
interface RuleEvaluator {
  canEvaluate(rule: Rule): boolean;
  evaluate(rule: Rule): boolean; // can read MobX observables for reactivity
}
```

Built-in evaluator (reads form values):

```ts
class ConditionRuleEvaluator implements RuleEvaluator {
  constructor(private form: FormModel) {}

  canEvaluate(rule: Rule) {
    return rule.type === "condition";
  }

  evaluate(rule: Rule): boolean {
    const value = this.form.getValue(rule.target);
    switch (rule.operator) {
      case "isEmpty":
        return !value;
      case "eq":
        return value === rule.value;
      // ...
    }
  }
}
```

External evaluator (injected via factory):

```ts
class AccessControlRuleEvaluator implements RuleEvaluator {
  constructor(private identity: IdentityContext) {}

  canEvaluate(rule: Rule) {
    return rule.type === "accessControl";
  }

  evaluate(rule: Rule): boolean {
    const [scope, id] = rule.value.split(":");
    if (scope === "team") return this.identity.isMemberOf(id);
    return this.identity.id === id;
  }
}
```

Unknown rule types (no evaluator returns `canEvaluate: true`) are ignored — the rule doesn't fire, the field/element remains in its default state. A console warning is emitted in development.

### Validation

**Required:** `.required(message)` is a first-class field concept, separate from zod schemas:

```ts
// Simple required
title: fields.text().label("Title").required("Title is required");

// Required + schema — required check runs first, then schema
slug: fields
  .text()
  .label("Slug")
  .required("Slug is required")
  .schema(z.string().regex(/^[a-z0-9-]+$/));

// Conditionally required — callback evaluated as MobX computed
discountCode: fields
  .text()
  .label("Discount Code")
  .requiredWhen(
    form => form.field("enableDiscount").getValue() === true,
    "Required when discount is enabled"
  );
```

Behavior:

- `.required()` checks for empty values (null, undefined, empty string) before the zod schema runs. If empty, short-circuits with the required error.
- Works without `.schema()` — a field can be required with no zod schema.
- Exposes `field.vm.required: boolean` — reactive for `requiredWhen()`, so the renderer can show a required indicator (`*`).
- `requiredWhen()` callback is a MobX computed — `field.vm.required` reactively flips as the condition changes.

**Zod schemas:** For shape/format validation beyond "not empty":

- Per-field: `.schema(z.string().email())` — validates individual field values.
- Per-list: `.listSchema(z.array().max(20))` — validates the array itself (length, etc.).
- Per-form (cross-field): via `addRule()` — see Form-Level Rules below.

**Validation order:** required check → zod schema → form-level rules. Only visible, enabled fields participate.

### Validation Flow and Error Surface

Validation is triggered by the Presenter (typically on a button click), not automatically. `form.validate()` returns a boolean and populates error state as a side effect — MobX reactivity handles the rest:

```ts
class EntryPresenter {
  async save() {
    const isValid = this.form.validate();
    if (!isValid) {
      // form.errors and per-field validation states are now populated
      // VM re-renders automatically via MobX
      return;
    }

    this.submitting = true;
    const data = this.form.getData();
    await this.repository.save(this.entry.id, data);
    this.submitting = false;
  }
}
```

**Error access at three levels:**

1. **Flat error list** — for a summary banner at the top of the form:

```ts
form.errors;
// [
//   { path: "title", label: "Page Title", message: "Title is required" },
//   { path: "metaTags.2.name", label: "Name", message: "Name is required" },
//   { path: "metaTags", label: "Meta Tags", message: "Maximum 20 meta tags" },
// ]
```

Paths use dot notation with numeric indices for list items (`metaTags.2.name`). `label` is included so the banner can show human-readable field names.

2. **Per-field validation** — already on each field's VM for inline display:

```ts
form.field("title").validation;
// { isValid: false, message: "Title is required" }

form.field("metaTags").items[2].field("name").validation;
// { isValid: false, message: "Name is required" }
```

3. **Section-level rollup** — object/list fields expose whether any descendant is invalid:

```ts
form.field("metaTags").hasErrors; // true if any item has any invalid field
form.field("metadata").hasErrors; // true if any nested field is invalid
```

This enables highlighting tabs/sections that contain errors:

```tsx
<Tab label="Meta Tags" hasError={vm.metaTags.hasErrors} />
```

No exceptions, no callbacks. Just state transitions — `validate()` populates observable error state, MobX re-renders the view.

### `.list()` as a Field Modifier

`.list()` is a modifier on any field type, not a separate field type. Mirrors the CMS pattern.

| Field type             | Singular value      | After `.list()`       |
| ---------------------- | ------------------- | --------------------- |
| `text()`               | `string`            | `string[]`            |
| `number()`             | `number`            | `number[]`            |
| `select()`             | `string`            | `string[]`            |
| `object().fields(...)` | `{ name, content }` | `{ name, content }[]` |

For simple lists (`fields.text().list()`), the field exposes `items` with value/onChange per item.
For object lists (`fields.object().list().fields(...)`), each item exposes its own nested fields.

List operations: `addItem()`, `removeItem(index)`, `moveItem(from, to)`.

**Item identity:** The FormModel generates a stable internal key per list item (not exposed as a data field). This key is available on the item VM for use as a React key. Array indices are not suitable because removing or reordering items causes React to reuse component instances with wrong data, corrupting internal state in complex renderers (rich text editors, file uploads, etc.).

### Templates on Object Fields (Dynamic Zones)

There is no dedicated `dynamicZone` field type. Instead, the `object` field supports an optional `.templates()` modifier. A templated object list is an object list where each item's fields are determined by a template selection:

```ts
content: fields
  .object()
  .label("Content Blocks")
  .list()
  .templates([
    {
      id: "hero",
      name: "Hero Banner",
      fields: fields => ({
        heading: fields.text().label("Heading"),
        image: fields.file().label("Image")
      })
    },
    {
      id: "richText",
      name: "Rich Text",
      fields: fields => ({
        body: fields.richText().label("Body")
      })
    },
    {
      id: "premium",
      name: "Premium Widget",
      visible: () => this.form.getValue("plan") === "enterprise",
      fields: fields => ({
        config: fields.json().label("Config")
      })
    }
  ]);
```

**Discriminator:** Each item carries a `_templateId` field that identifies which template is active. This matches the existing CMS data format:

```json
[
  { "_templateId": "hero", "heading": "Welcome", "image": "..." },
  { "_templateId": "richText", "body": "Lorem ipsum..." }
]
```

**Behavior:**

- On `setData()`: reads `_templateId` from each item, matches to template definition, instantiates that template's fields.
- On `addItem({ _templateId: "hero" })`: the template ID is enough — the FormModel looks up the template, instantiates its fields, and populates default values. The renderer shows a template picker with available templates, then calls `addItem()` with the selected ID.
- On `getData()`: each item includes `_templateId` alongside field values.
- The renderer has access to the field definition (including template list) and handles template selector UI.

**Template visibility:** Each template supports an optional `visible` callback — a MobX computed that controls whether the template appears in the picker for new items. Existing items with a hidden template remain visible and editable — visibility only affects the picker, not existing data.

This avoids a separate field type — dynamic zones are just object lists with template-driven field sets.

### Options (Select / MultiSelect)

`.options()` accepts a static array or a reactive function. The function receives `form` as an argument (same pattern as `beforeChange`, `afterChange`, `defaultValue`):

```ts
type Option = { label: string; value: string };

// Static
role: fields.select().options([
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" }
]);

// Reactive — computed from observable state (repository captured via closure)
category: fields
  .select()
  .options(form => repository.categories.map(c => ({ label: c.name, value: c.id })));

// Dependent on another field — form arg provides access
city: fields.select().options(form => {
  const country = form.getValue("country");
  return repository.citiesByCountry.get(country) ?? [];
});
```

Design decisions:

- When a function is provided, it's evaluated as a MobX computed — automatically re-derives when observed dependencies change.
- No loading/empty state handling — that's a Presenter/VM concern.
- No auto-clearing of values when options change — validation catches invalid selections.
- `Option` is `{ label: string; value: string }` — no generics, no groups, no metadata for now.

### Conditional Visibility

Field and layout element visibility is controlled by the rules system. Rules with `action: "hide"` control visibility; rules with `action: "disable"` control the disabled state. See the **Rules System** section for the full rule format, cascading behavior, and evaluation model.

Hidden fields are excluded from validation and from the VM.

### Form-Level Rules (Cross-Field Validation)

Two complementary approaches:

**Zod refinements (declarative):**

```ts
this.form.addRule(
  z.refine(data => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"]
  })
);
```

**Imperative rules (for complex logic needing FormModel access).** Imperative rules return errors rather than mutating state directly:

```ts
this.form.addRule((data, form) => {
  if (form.getField("discount").visible && !data.discountCode) {
    return { path: "discountCode", message: "Required when discount is enabled" };
  }
});
```

The FormModel clears all errors before each validation pass, then collects errors from field schemas and form-level rules. No mutation during validation — rules produce errors, the FormModel collects them.

Validation order: field schemas first, then form-level rules.

### Default Values

`.defaultValue()` accepts a static value or a factory function:

```ts
// Static
status: fields.text().defaultValue("draft");

// Factory — called each time a default is needed (e.g., per addItem())
id: fields
  .text()
  .renderer("hidden")
  .defaultValue(() => generateId());

// Factory with form access — default depends on current form state
currency: fields.text().defaultValue(form => (form.getValue("country") === "US" ? "USD" : "EUR"));
```

Behavior:

- Static values are used as-is.
- Factory functions (`(form) => T`) are called each time the FormModel needs a default — once per `addItem()` for list items, once on form init for top-level fields. The factory receives the form instance for reading current state.
- This is a **one-shot read**, not reactive — the default is set once at creation time, then the user owns the value.
- On `setData()`, defaults (static or factory) only apply to **missing** fields — existing data is never overwritten.

Common use case — hidden auto-generated IDs in list items:

```ts
metaTags: fields
  .object()
  .label("Meta Tags")
  .list()
  .fields(fields => ({
    id: fields
      .text()
      .renderer("hidden")
      .defaultValue(() => generateId()),
    name: fields.text().label("Name"),
    content: fields.text().label("Content")
  }));
```

Each `addItem()` call creates a new item with a unique `id`, while `name` and `content` start empty.

### Data Hydration

`form.setData(data)` hydrates the form with external data (e.g., from an API response):

```ts
async load(id: string) {
    const page = await this.repository.getById(id);
    this.form.setData(page);
}
```

After `setData({ title: "My Page", metaTags: [{ name: "desc", content: "..." }, ...] })`:

- Scalar fields get their values set.
- List fields instantiate the correct number of item VMs with nested field values populated.
- `form.isDirty` → `false` (baseline is reset).

Behavior:

- **Dirty tracking resets** — `setData()` establishes a new baseline. Only subsequent user edits make the form dirty. This is distinct from `field.setValue()` which marks the form dirty.
- **No validation on hydrate** — data came from the API, presumably valid. Validation only triggers on user interaction or explicit `form.validate()` / `form.submit()`.
- **Partial data supported** — missing fields fall back to their `.defaultValue()` (if defined) or type defaults. This is essential for form evolution (new fields added over time) and decorator-added fields.
- **Re-hydration** — calling `setData()` again fully replaces state, resets dirty tracking, and clears all validation errors.

### Form Reset

`form.reset()` reverts the form to the last baseline established by `setData()`:

```ts
// User clicks Cancel
presenter.cancel() {
    this.form.reset(); // reverts to last setData() snapshot
}
```

Behavior:

- All field values revert to their `setData()` values (or defaults if no `setData()` was called).
- All validation errors are cleared.
- `form.isDirty` → `false`.
- The FormModel internally snapshots on `setData()` to support this.

### Per-Field Renderer Hint

Fields can specify a renderer name to select a specific component from the renderer registry:

```ts
description: fields.text().label("Description").renderer("textarea"); // picks TextareaRenderer instead of default TextRenderer

avatar: fields.text().label("Avatar").renderer("image"); // picks ImageRenderer
```

If no `.renderer()` is specified, the registry falls back to the default renderer for that field type.

### Generic Form Rendering

The generic renderer walks the layout tree, resolving field references to the FormModel. Two renderers work together: a **layout node renderer** (dispatches by node type) and a **field renderer** (dispatches by field type + renderer hint).

**Field VM** — each field exposes a VM for the renderer:

```ts
interface FieldVM {
    name: string;
    type: "text" | "number" | "select" | "multiSelect" | "object" | ...;
    label: string;
    placeholder?: string;
    help?: string;
    value: any;
    validation: { isValid: boolean | null; message?: string };
    validating: boolean;            // true while async validation is in-flight
    required: boolean;              // computed from .required() or .requiredWhen()
    visible: boolean;               // computed from rules (hide rules + ancestor visibility)
    disabled: boolean;              // computed from rules (disable rules + ancestor disabled state)
    renderer?: string;              // renderer hint
    options?: Option[];             // for select/multiSelect
    onChange: (value: any) => void;
}
```

`visible` and `disabled` are MobX computeds that resolve the full rule cascade — the field's own rules merged with ancestor layout element rules. The renderer receives the final resolved state and passes it directly to Design System components.

**Field renderer registry** — maps field type (+ optional renderer hint) to a React component:

```tsx
const fieldRenderers: Record<string, React.FC<{ field: FieldVM }>> = {
  text: TextFieldRenderer,
  "text:textarea": TextareaFieldRenderer,
  "text:image": ImageFieldRenderer,
  number: NumberFieldRenderer,
  select: SelectFieldRenderer,
  multiSelect: MultiSelectFieldRenderer
};

const FieldRenderer = observer(({ field, renderers }) => {
  if (!field.visible) return null;
  const key = field.renderer ? `${field.type}:${field.renderer}` : field.type;
  const Renderer = renderers[key] ?? renderers[field.type];
  return <Renderer field={field} />;
});
```

**Layout node renderer** — dispatches by node type, recurses for nested structures:

```tsx
const LayoutNodeRenderer = observer(({ node, form, fieldScope, renderers }) => {
  switch (node.type) {
    case "row":
      return (
        <div className="flex gap-md">
          {node.fieldIds.map(id => {
            const field = fieldScope === form ? form.resolveField(id) : fieldScope.field(id);
            return <FieldRenderer key={id} field={field.vm} renderers={renderers} />;
          })}
        </div>
      );

    case "separator":
      return <hr />;

    case "element":
      if (node.visible && !node.visible()) return null;
      const Element = renderers[`element:${node.renderer}`];
      return <Element form={form} {...node.props} />;

    case "tabs":
      return <TabsRenderer node={node} form={form} fieldScope={fieldScope} renderers={renderers} />;

    case "object":
      const objField = form.resolveField(node.fieldId);

      if (!objField.isList) {
        return (
          <div>
            {node.layout.map((child, i) => (
              <LayoutNodeRenderer
                key={i}
                node={child}
                form={form}
                fieldScope={objField}
                renderers={renderers}
              />
            ))}
          </div>
        );
      }

      return (
        <div>
          <label>{objField.label}</label>
          {objField.items.map((item, index) => {
            const itemLayout = node.templates ? node.templates[item.templateId] : node.layout;
            return (
              <div key={item.key}>
                {itemLayout.map((child, i) => (
                  <LayoutNodeRenderer
                    key={i}
                    node={child}
                    form={form}
                    fieldScope={item}
                    renderers={renderers}
                  />
                ))}
                <button onClick={() => objField.removeItem(index)}>Remove</button>
              </div>
            );
          })}
          <button onClick={() => objField.addItem()}>Add</button>
        </div>
      );
  }
});
```

**Top-level `<FormView>`:**

```tsx
const FormView = observer(({ form, renderers }) => (
  <div>
    {form.layout.map((node, i) => (
      <LayoutNodeRenderer key={i} node={node} form={form} fieldScope={form} renderers={renderers} />
    ))}
  </div>
));
```

**Two modes of usage coexist:**

| Mode                  | When to use                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Generic rendering** | CMS-driven forms, settings forms, CRUD, admin panels — `<FormView form={form} />` and done       |
| **Manual VM**         | Complex layouts, conditional sections, custom UX — Presenter builds the VM, View is hand-crafted |

### Decorability

Each FormModel has a dedicated modifier abstraction. The Presenter creates the form with defaults, then passes it through each modifier in sequence:

```ts
const PageSettingsFormModifier = createAbstraction<FormModifier<PageSettings>>();

class PageSettingsPresenter {
    constructor(
        private formFactory: FormModelFactory,
        private repository: PageSettingsRepository.Interface,
        private modifiers: PageSettingsFormModifier.Interface[],
    ) {
        this.form = this.formFactory.create<PageSettings>({
            fields: fields => ({ ... }),
            layout: layout => [ ... ],
        });

        for (const modifier of this.modifiers) {
            modifier.modify(this.form);
        }

        makeAutoObservable(this);
    }
}
```

**FormModel mutation API:**

| Method                              | Behavior                                                                                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `form.fields(fields => ({ ... }))`  | Merges new fields into the existing field map. Same key without `.extend()` replaces the field. Same key with `.extend()` merges child fields (objects only). Supports `.replace()` and `.remove()` operations. |
| `form.field("name")`                | Access an existing field to append `beforeChange`/`afterChange` handlers or modify properties. Returns base `FieldBuilder` with common operations.                                                              |
| `form.field("name").as("type")`     | Narrows field access to a specific field type builder, enabling type-specific mutations. See **Type-Narrowed Field Access** below.                                                                              |
| `form.layout(layout => [ ... ])`    | Appends layout nodes to the existing layout tree. Supports positional modifiers (`.before()`, `.after()`, `.replace()`, `.remove()`). See **Layout Positioning** below.                                         |
| `form.layout("nodeId")`             | Access a named layout node for mutation. Returns a base handle, narrowed via `.as("tabs")` etc. See **Layout Node Access and Mutation** below.                                                                  |
| `form.setLayout(layout => [ ... ])` | Replaces the entire layout tree.                                                                                                                                                                                |

### Type-Narrowed Field Access

`form.field("name")` returns a base `FieldBuilder` with operations common to all field types: `beforeChange`, `afterChange`, `disabled`, `setValue`, `getValue`. For type-specific operations, use `.as()` to narrow:

```ts
form.field("seo").as("object"); // → ObjectFieldBuilder (has .fields())
form.field("title").as("text"); // → TextFieldBuilder
```

`.as()` provides autocomplete of all registered field type names. If the field's actual type doesn't match, it throws in development — runtime validation, same philosophy as `useDialog(zodSchema)`.

Common operations don't need `.as()`:

```ts
// Base FieldBuilder — no narrowing needed
form.field("path").beforeChange((value, form) => { ... });
form.field("title").afterChange((value, form) => { ... });
form.field("title").disabled(true);

// Type-specific — narrowing required
form.field("seo").as("object").fields(fields => ({ ... }));
```

### Field Operations: Replace and Remove

Modifiers can replace or remove existing fields:

```ts
form.fields(fields => ({
  // Add new field (default)
  language: fields.select().label("Language"),

  // Replace an existing field entirely
  title: fields.replace().text().label("Page Title").renderer("custom-title-input"),

  // Remove a field
  snippet: fields.remove()
}));
```

### Layout Positioning

Layout nodes support positional modifiers for precise placement within the existing layout tree:

```ts
form.layout(layout => [
    // Append (default — goes at the end)
    layout.row("language"),

    // Insert before a specific field/element
    layout.row("language").before("title"),

    // Insert after a specific field/element
    layout.row("snippet").after("path"),

    // Replace a node that contains the target field
    layout.row("title", "subtitle").replace("title"),

    // Remove a node by field reference
    layout.remove("snippet"),

    // Append a tab to an existing tabs node
    layout.tab("custom", {
        label: "Custom",
        description: "My super custom group",
        icon: "star",
        layout: [layout.row("customTitle")]
    }),

    // Position a tab relative to other tabs
    layout.tab("schema", { ... }).after("seo"),
    layout.tab("intro", { ... }).before("general"),
]);
```

The `before`/`after` target is a field ID or tab ID. The system searches the layout tree for the node containing that reference and inserts relative to it. First match in tree order wins. In practice, field IDs are unique within a form.

### Layout Node Access and Mutation

`form.layout()` has two overloads:

- `form.layout(layout => [...])` — append nodes to the root layout tree, with optional positional modifiers
- `form.layout("nodeId")` — access a named layout node for mutation, returns a base handle that can be narrowed via `.as()`

Named layout nodes (e.g., tabs containers with `id`) can be accessed and mutated by modifiers:

```ts
// Access a named tabs container and narrow to its type
form.layout("settings").as("tabs");
```

The `.as("tabs")` handle exposes:

- `.tab({ id, label, layout, ... })` — add a new tab (returns a handle with `.before()` / `.after()`)
- `.tab("seo")` — access an existing tab by id (returns a handle with `.layout()` for appending to its layout)

#### Full modifier examples

```ts
// === Base form definition ===
this.form = this.formFactory.create({
  fields: fields => ({
    title: fields.text().label("Title"),
    slug: fields.text().label("Slug"),
    description: fields.text().label("Description"),
    metaTitle: fields.text().label("Meta Title"),
    metaDescription: fields.text().label("Meta Description")
  }),
  layout: layout => [
    layout.row("title", "slug"),
    layout.separator(),
    layout.tabs({
      id: "settings",
      tabs: [
        {
          id: "general",
          label: "General",
          layout: [layout.row("description")]
        },
        {
          id: "seo",
          label: "SEO",
          layout: [layout.row("metaTitle"), layout.row("metaDescription")]
        }
      ]
    })
  ]
});

// === Modifier A: add a new tab ===
class AddAnalyticsTabModifier implements FormModifier {
  modify(form: FormModel) {
    form.fields(fields => ({
      trackingId: fields.text().label("Tracking ID"),
      enableAnalytics: fields
        .select()
        .label("Enable")
        .options([
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" }
        ])
    }));

    form
      .layout("settings")
      .as("tabs")
      .tab({
        id: "analytics",
        label: "Analytics",
        icon: "chart",
        layout: layout => [layout.row("trackingId", "enableAnalytics")]
      })
      .after("seo");
  }
}

// === Modifier B: append to an existing tab's layout ===
class AddOgImageModifier implements FormModifier {
  modify(form: FormModel) {
    form.fields(fields => ({
      ogImage: fields.text().label("OG Image").renderer("image")
    }));

    form
      .layout("settings")
      .as("tabs")
      .tab("seo")
      .layout(layout => [layout.row("ogImage")]);
  }
}

// === Modifier C: positional insert in root layout ===
class AddSubtitleModifier implements FormModifier {
  modify(form: FormModel) {
    form.fields(fields => ({
      subtitle: fields.text().label("Subtitle")
    }));

    form.layout(layout => [layout.row("subtitle").after("slug")]);
  }
}
```

**Modifier examples:**

```ts
// Add a new top-level field.
class AddCustomFieldModifier implements FormModifier<PageSettings> {
    modify(form: FormModel<PageSettings>) {
        form.fields(fields => ({
            customField: fields.text().label("Custom"),
        }));

        form.layout(layout => [
            layout.row("customField"),
        ]);
    }
}

// Extend an existing object field with new child fields.
class AddOgFieldsModifier implements FormModifier<PageSettings> {
    modify(form: FormModel<PageSettings>) {
        form.fields(fields => ({
            seo: fields.extend().object().fields(fields => ({
                ogDescription: fields.text().label("OG Description"),
                ogLocale: fields.text().label("OG Locale"),
            })),
        }));

        form.layout(layout => [
            layout.row("seo.ogDescription", "seo.ogLocale"),
        ]);
    }
}

// Replace the entire layout.
class CustomLayoutModifier implements FormModifier<PageSettings> {
    modify(form: FormModel<PageSettings>) {
        form.setLayout(layout => [
            layout.tabs([ ... ]),
        ]);
    }
}
```

The `.extend()` pattern matches the CMS model builder (`fields.extend().object().fields(...)`) — without `.extend()`, redefining the same key replaces the field entirely.

### Modifier Interaction with Core Fields

Modifiers receive the full `FormModel` — not a sandbox. They can add new fields, but also attach behavior to existing core fields via `beforeChange` and `afterChange` pipelines.

**Example: Language-aware path generation.** The core form defines `title` and `path` fields, where `title.afterChange` auto-generates the path. A translations modifier (from a separate package) adds a `language` field and needs to prefix the path with the language code — regardless of what triggered the path change.

Core form (page builder package):

```ts
this.form = this.formFactory.create({
  fields: fields => ({
    title: fields
      .text()
      .label("Title")
      .afterChange((value, form) => {
        if (!form.field("path").dirty) {
          form.field("path").setValue(slugify(value));
        }
      }),
    path: fields.text().label("Path").beforeChange(slugify)
  }),
  layout: layout => [layout.row("title"), layout.row("path")]
});
```

Translations modifier (separate package):

```ts
class AddLanguageSelectorModifier implements FormModifier {
  constructor(private featureFlags: FeatureFlagService) {}

  modify(form: FormModel) {
    if (!this.featureFlags.isEnabled("translations")) return;

    // Add the language field with an afterChange that re-triggers path processing
    form.fields(fields => ({
      language: fields
        .select()
        .label("Language")
        .renderer("language-selector")
        .afterChange((langCode, form) => {
          const path = form.field("path").value;
          const stripped = path.replace(/^\/[a-z]{2}\//, "/");
          form.field("path").setValue(stripped);
        })
    }));

    // Append to the existing path field's beforeChange pipeline —
    // this runs on EVERY path setValue(), regardless of source
    form.field("path").beforeChange((value, form) => {
      const lang = form.getValue("language");
      if (!lang) return value;
      const stripped = value.replace(/^\/[a-z]{2}\//, "/");
      return `/${lang}${stripped}`;
    });

    form.layout(layout => [layout.row("language")]);
  }
}
```

The pattern:

- **`beforeChange` on the target field** is the single source of truth for the transformation. It intercepts every value change regardless of source (title auto-generation, direct user input, another modifier).
- **`afterChange` on the trigger field** nudges the target to re-run its pipeline.
- All cases flow through the same code path: title changes → core `afterChange` sets path → `beforeChange` pipeline applies prefix. Language changes → language `afterChange` re-sets path → same `beforeChange` pipeline. Direct path edit → `beforeChange` pipeline applies prefix.

This demonstrates a key property of the modifier system: modifiers can **append** to existing fields' `beforeChange`/`afterChange` pipelines without replacing the core behavior. The core form doesn't know about the translations modifier, and the translations modifier doesn't re-implement path generation — it layers on top.

## Full Example

### Presenter

```ts
import { makeAutoObservable } from "mobx";
import { z } from "zod";

class PageSettingsPresenter {
  private form: FormModel<PageSettings>;
  private submitting = false;

  constructor(
    private formFactory: FormModelFactory,
    private repository: PageSettingsRepository.Interface
  ) {
    this.form = this.formFactory.create<PageSettings>({
      validateOnSubmit: true,
      fields: fields => ({
        title: fields
          .text()
          .label("Page Title")
          .placeholder("Enter page title")
          .schema(z.string().min(1, "Title is required"))
          .afterChange((value, form) => {
            if (!form.field("slug").dirty) {
              form.field("slug").setValue(value);
            }
          }),

        slug: fields
          .text()
          .label("Slug")
          .placeholder("page-slug")
          .schema(
            z
              .string()
              .min(1, "Slug is required")
              .refine(async value => {
                const exists = await this.repository.slugExists(value);
                return !exists;
              }, "This slug is already taken")
          )
          .beforeChange(slugify),

        metaTags: fields
          .object()
          .label("Meta Tags")
          .list()
          .fields(fields => ({
            name: fields
              .text()
              .label("Name")
              .placeholder("e.g. description")
              .schema(z.string().min(1, "Name is required")),
            content: fields
              .text()
              .label("Content")
              .placeholder("e.g. My page description")
              .schema(z.string().min(1, "Content is required"))
          }))
          .listSchema(z.array().max(20, "Maximum 20 meta tags"))
      }),
      layout: layout => [
        layout.row("title", "slug"),
        layout.separator(),
        layout.object("metaTags", [layout.row("name", "content")])
      ]
    });

    makeAutoObservable(this);
  }

  get vm() {
    return {
      form: this.form.vm,
      canSubmit: this.form.isValid && this.form.isDirty && !this.submitting,
      submitting: this.submitting,
      submit: () => this.save()
    };
  }

  async save() {
    this.submitting = true;
    try {
      const data = await this.form.submit();
      await this.repository.save(data);
    } finally {
      this.submitting = false;
    }
  }
}
```

### React View (dumb)

```tsx
import React from "react";
import { observer } from "mobx-react-lite";

export const PageSettingsView = observer(({ vm }) => {
  return (
    <div>
      <FormView form={vm.form} />
      <div className="mt-lg">
        <Button
          onClick={vm.submit}
          text={vm.submitting ? "Saving..." : "Save"}
          disabled={!vm.canSubmit}
        />
      </div>
    </div>
  );
});
```

## Layout

### Separation of Fields and Layout

`fields` contains **only data fields** — no tabs, no separators, no layout concerns. All visual structure lives in `layout`. This separation enables:

- Clean `getData()` — just reads all fields, no skipping layout nodes or hoisting tab-scoped fields.
- Same form, different layouts — swap layouts per persona, device, or context at runtime.
- Independent decoration — decorators can modify fields and layout separately.
- Flat field registry — field discovery doesn't require traversing layout nodes.

### Layout Tree

Layout is a tree of nodes defined via a builder. Top-level scalar fields and nested object fields use **dot-notation paths** (`"seo.metaTitle"`). The only place relative field names exist is inside `layout.object()`, where field names are relative to the object/item — because list items are repeated and the index isn't known at definition time.

```ts
this.form = formFactory.create<PageSettings>({
    fields: fields => ({
        title: fields.text().label("Title"),
        slug: fields.text().label("Slug"),
        description: fields.text().label("Description"),
        plan: fields.select().label("Plan").options([...]),
        seo: fields.object().fields(fields => ({
            metaTitle: fields.text().label("Meta Title"),
            metaDescription: fields.text().label("Meta Description"),
            ogImage: fields.file().label("OG Image"),
        })),
        blocks: fields.object().list().templates([
            {
                id: "hero",
                name: "Hero Banner",
                fields: fields => ({
                    heading: fields.text().label("Heading"),
                    image: fields.file().label("Image"),
                    cta: fields.text().label("CTA"),
                }),
            },
            {
                id: "twoColumn",
                name: "Two Column",
                fields: fields => ({
                    left: fields.richText().label("Left"),
                    right: fields.richText().label("Right"),
                    dividerStyle: fields.select().label("Divider"),
                }),
            },
        ]),
        metaTags: fields.object().list().fields(fields => ({
            name: fields.text().label("Name"),
            content: fields.text().label("Content"),
        })),
    }),
    layout: layout => [
        layout.row("title", "slug"),

        layout.separator(),

        layout.tabs({
            id: "settings",
            tabs: [
            {
                id: "general",
                label: "General",
                layout: [
                    layout.row("description"),
                ],
            },
            {
                id: "seo",
                label: "SEO",
                rules: [
                    { type: "condition", target: "title", operator: "isEmpty", value: null, action: "disable" }
                ],
                layout: [
                    layout.row("seo.metaTitle", "seo.ogImage"),
                    layout.row("seo.metaDescription"),
                ],
            },
            {
                id: "content",
                label: "Content",
                layout: [
                    layout.object("blocks", {
                        hero: [
                            layout.row("heading"),
                            layout.row("image", "cta"),
                        ],
                        twoColumn: [
                            layout.row("left", "right"),
                            layout.row("dividerStyle"),
                        ],
                    }),
                ],
            },
            {
                id: "meta",
                label: "Meta Tags",
                layout: [
                    layout.object("metaTags", [
                        layout.row("name", "content"),
                    ]),
                ],
            },
        ]}),

        layout.element("usage-stats", {
            visible: () => this.form.getValue("plan") === "enterprise",
        }),
    ],
});
```

### Layout Node Types

```ts
type LayoutNode = RowNode | SeparatorNode | TabsNode | ElementNode | ObjectNode;

interface RowNode {
  type: "row";
  fieldIds: string[]; // dot-notation paths: "title", "seo.metaTitle"
}

interface SeparatorNode {
  type: "separator";
}

interface TabsNode {
  type: "tabs";
  id?: string; // optional name for targeting by modifiers
  tabs: TabDefinition[];
  rules?: Rule[]; // rules on the tabs container itself
  activeTabId: string; // observable
  setActiveTab(id: string): void;
  disabled: boolean; // computed from rules
  visible: boolean; // computed from rules
}

interface TabDefinition {
  id: string;
  label: string | (() => string);
  description?: string; // tab description text (e.g., "Optimize how this page appears...")
  rules?: Rule[]; // rules on this individual tab
  icon?: string;
  layout: LayoutNode[];
  hasErrors: boolean; // computed from form fields referenced in this tab's layout
  disabled: boolean; // computed from own rules + parent tabs container rules
  visible: boolean; // computed from own rules + parent tabs container rules
}

interface ElementNode {
  type: "element";
  renderer: string;
  visible?: () => boolean;
  props?: Record<string, any>;
}

interface ObjectNode {
  type: "object";
  fieldId: string;
  layout?: LayoutNode[];
  templates?: Record<string, LayoutNode[]>;
}
```

**`layout.object()` overloads:**

```ts
// Single object or non-templated list — array of layout nodes.
layout.object("seo", [layout.row("metaTitle", "ogImage"), layout.row("metaDescription")]);

layout.object("metaTags", [layout.row("name", "content")]);

// Templated list — layout keyed by template ID.
layout.object("blocks", {
  hero: [layout.row("heading"), layout.row("image", "cta")],
  twoColumn: [layout.row("left", "right"), layout.row("dividerStyle")]
});
```

Field names inside `layout.object()` are **relative** to the object/item. This is the only place relative names exist — everywhere else uses dot-notation paths from the form root.

### Field Name Resolution

**Outside `layout.object()`** — field names are dot-notation paths from the form root:

- `"title"` → `form.field("title")`
- `"seo.metaTitle"` → `form.field("seo").field("metaTitle")`

**Inside `layout.object()`** — field names are relative to the object/item:

- Inside `layout.object("seo", [...])`: `"metaTitle"` → `form.field("seo").field("metaTitle")`
- Inside `layout.object("blocks", { hero: [...] })` for item 3: `"heading"` → `form.field("blocks").items[3].field("heading")`

### Tabs

Tabs are purely visual grouping — they don't contribute data or own fields. Fields referenced inside a tab's layout are regular form fields defined in the flat `fields` map.

**Key behaviors:**

- **Data is flat** — `form.getValue("title")`, not scoped under a tab. `getData()` reads all fields directly.
- **Tab visibility** — controlled by rules with `action: "hide"`. A hidden tab means its fields are physically hidden and **excluded from validation**.
- **Tab disabled** — controlled by rules with `action: "disable"`. A disabled tab's fields all have `disabled: true` on their VM. The tab is still visible and accessible.
- **Inactive tab** — an inactive (but visible) tab still participates in validation. "Hidden" means `visible: false` via rules, not "tab not currently selected".
- **Programmatic tab switching** — `layout.tabs[0].setActiveTab("seo")`.
- **Error rollup** — each tab computes `hasErrors` from the validation state of the fields referenced in its layout tree.

### Default Layout

If no `layout` is specified, defaults to single-column top-to-bottom (one field per row, in definition order). Object fields auto-generate inner layouts the same way. Template fields without explicit template layouts use the template's field definition order.

## Validation Strategy

### Validation Timing

The FormModel accepts a `validateOnSubmit` option that controls when field validation runs:

```ts
this.form = formFactory.create<PageSettings>({
  validateOnSubmit: true, // default
  fields: fields => ({
    title: fields.text().schema(z.string().min(1, "Required")),
    slug: fields.text().schema(
      z
        .string()
        .min(1, "Required")
        .refine(async v => !(await api.slugExists(v)), "Taken")
    )
  })
});
```

| `validateOnSubmit` | Behavior                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default)   | No field validation until `form.submit()` / `form.validate()` is called for the first time. After the first submit attempt, every `onChange` triggers validation for the changed field. |
| `false`            | Every `onChange` immediately triggers validation for the changed field.                                                                                                                 |

In both modes, `form.validate()` / `form.submit()` always validates all fields.

### Async Validation via Zod Refine

Async validation uses zod's built-in `.refine()` with an async callback — no separate `.asyncValidator()` method:

```ts
slug: fields
  .text()
  .label("Slug")
  .schema(
    z
      .string()
      .min(1, "Required")
      .refine(async value => {
        const exists = await this.repository.slugExists(value);
        return !exists;
      }, "This slug is already taken")
  );
```

The FormModel always uses `schema.parseAsync()` internally, which handles both sync and async schemas uniformly. Zod runs sync validations first — if they fail, async refinements are skipped.

**Behavior:**

- On `onChange`: follows the same timing rules as sync validation (`validateOnSubmit` flag). When active, async refinements run on every change.
- On `form.validate()` / `form.submit()`: all field schemas run in parallel (`Promise.all`) across fields.
- `form.validate()` signature is `async validate(): Promise<boolean>`.
- **Memoized by input** — if the value hasn't changed since the last run, the previous result is returned immediately without re-executing the schema. This avoids redundant API calls (e.g., re-checking slug uniqueness on `form.submit()` when the slug was already validated on `onChange`). Memoization has no TTL — for long-lived forms, `form.submit()` force-revalidates all async schemas regardless of memoization.

**Field VM — `validating` flag:**

```ts
interface FieldVM {
  // ...existing
  validating: boolean; // true while async validation is in-flight
}
```

The FormModel detects whether a field's schema contains async refinements and sets `validating: true` while `parseAsync()` is in-flight.

### Debouncing

Async schemas triggered by `onChange` are automatically debounced (default 300ms) to avoid excessive API calls during typing. The debounce interval is configurable per field:

```ts
slug: fields.text()
    .label("Slug")
    .debounce(500)
    .schema(z.string().min(1).refine(async (v) => ..., "Taken"))
```

Default debounce: 300ms. Sync validators are never debounced.

## Value Transformations

### `beforeChange`

A pipeline that transforms the value before it's stored. Runs synchronously on every `setValue()`:

```ts
slug: fields
  .text()
  .label("Slug")
  .beforeChange(slugify)
  .beforeChange(value => value.toLowerCase());
```

With form access:

```ts
code: fields
  .text()
  .label("Code")
  .beforeChange((value, form) => {
    const prefix = form.getValue("country");
    return `${prefix}-${value}`;
  });
```

**Behavior:**

- Multiple `.beforeChange()` calls chain left-to-right (pipe). This includes calls from modifiers — a modifier calling `form.field("path").beforeChange(fn)` appends to the existing pipeline, it doesn't replace it.
- The field's `value` observable gets the **transformed** result. The view sees the transformed value.
- Runs only on user-driven `setValue()`, **not** on `setData()` hydration — API data is already in final form.
- Sync-only — async transforms belong in the Presenter.

### `afterChange`

A hook for side effects after a field value changes:

```ts
country: fields.select()
    .label("Country")
    .options([...])
    .afterChange((value, form) => {
        form.field("city").setValue("");
        form.field("currency").setValue(value === "US" ? "USD" : "EUR");
    })
```

**Behavior:**

- Runs after `beforeChange` transforms and after the value is stored.
- Multiple `.afterChange()` calls chain — all run in definition order. Modifiers append to the existing chain.
- Receives the final (post-transform) value.
- Runs only on user-driven `setValue()`, **not** on `setData()`.
- Sync-only — for async side effects (e.g., fetching cities), trigger from the Presenter by observing the field value.
- `afterChange` calls to `setValue()` on other fields **do** trigger those fields' `beforeChange`/`afterChange` pipelines.
- Recursion is guarded — if `afterChange` triggers a cycle (A changes B, B changes A), the guard stops after one round (a field's `afterChange` won't re-fire if its value didn't actually change).

## Decided

1. **Zod schema composition** — the FormModel will attempt to auto-compose per-field `.schema()` definitions and form-level `addRule()` rules into a single `z.object()` internally. If full composition becomes too complex, fall back to validating fields individually + running form rules separately — as long as the form validates correctly.

2. **Item identity for lists** — the FormModel generates a stable internal key per list item. This key is exposed on the item VM for use as React keys. Array indices are not used as keys.

3. **`moveItem(from, to)`** — deferred, not included for now.

4. **Package** — FormModel lives in the `app-admin` package (`@webiny/app-admin`).

5. **Migration** — clean break. FormModel is a new feature, implemented for new modules only. No migration of existing `packages/form` usage.

6. **`beforeChange` runs only on `setValue()`** — not on `setData()` hydration. API data is already in final form.

7. **`afterChange` runs only on `setValue()`** — not on `setData()`. Cascading is allowed: `afterChange` calling `setValue()` on other fields triggers those fields' pipelines. Recursion guard: a field's `afterChange` won't re-fire if its value didn't actually change.

8. **Validation timing** — controlled by `validateOnSubmit` (default `true`). When `true`, no field validation until first `form.submit()` / `form.validate()`, then every `onChange` validates the changed field. When `false`, every `onChange` validates immediately.

9. **Async validation via zod refine** — no separate `.asyncValidator()` method. Async checks use `z.refine(async ...)` inside `.schema()`. The FormModel always uses `parseAsync()` internally, which handles both sync and async schemas uniformly.

10. **Async schema debouncing** — async schemas triggered by `onChange` are debounced (default 300ms, configurable per field via `.debounce()`). Sync-only schemas are never debounced.

11. **Async schema memoization** — if the input value is the same as the previous run, the cached result is returned without re-executing `parseAsync()`. On `form.submit()`, all async schemas are force-revalidated regardless of memoization.

12. **Fields and layout are separate concerns** — `fields` contains only data fields (no tabs, separators, elements). All visual structure lives in `layout`. This enables clean `getData()`, runtime layout swapping, and independent decoration.

13. **Dot-notation field paths in layout** — top-level and nested object fields use dot-notation paths (`"seo.metaTitle"`) in the layout. The only place relative field names exist is inside `layout.object()`, where names are relative to the object/item.

14. **`layout.object()` unifies object and list layouts** — `layout.object("fieldId", LayoutNode[])` handles single objects and non-templated lists (array form). `layout.object("fieldId", Record<string, LayoutNode[]>)` handles templated lists (keyed by template ID). The renderer checks the field definition to distinguish singular vs list. No separate `ListNode` type.

15. **Hidden tab = excluded from validation** — a tab with rules evaluating to `action: "hide"` means its fields are physically hidden and don't participate in validation. A disabled tab (`action: "disable"`) still validates. An inactive (but visible) tab still validates.

16. **Rules use JSON format** — rules on fields and layout elements use a uniform `{ type, target, operator, value, action }` JSON structure. No fluent API for rules at this time.

17. **Rule evaluation is pluggable** — `condition` rules are evaluated by a built-in evaluator that reads form values. `accessControl` rules and future rule types are evaluated by external evaluators injected via the `FormModelFactory`. Unknown rule types are ignored with a console warning in development.

18. **Rule cascading** — rules on parent layout elements (tabs containers, individual tabs) cascade to child fields. A field's resolved `disabled`/`visible` state is the combination of its own rules and all ancestor rules.

19. **FormModelFactory** — a DI-registered factory pre-configures every FormModel with standard rule evaluators and cross-cutting concerns. Presenters never wire evaluators manually.

20. **Form-level imperative rules return errors** — imperative rules passed to `addRule()` return error objects rather than mutating form state directly. The FormModel clears all errors before each validation pass and collects errors from all sources.

21. **Form reset** — `form.reset()` reverts the form to the last `setData()` baseline, clears validation errors, and resets dirty tracking.

22. **Modifiers can interact with core fields** — modifiers receive the full `FormModel` and can append `beforeChange`/`afterChange` handlers to existing fields without replacing core behavior. `beforeChange` on the target field is the preferred pattern for transformations that must apply regardless of what triggered the change. `afterChange` on the trigger field is used to nudge the target to re-run its pipeline.

23. **Type-narrowed field access via `.as()`** — `form.field("name")` returns a base `FieldBuilder`. `.as("type")` narrows to a specific field type builder for type-specific operations (e.g., `.fields()` on `object`). Throws in development if the actual field type doesn't match.

24. **Field replace and remove** — modifiers can replace an existing field entirely via `fields.replace().text()...` or remove a field via `fields.remove()`. This operates on the field map, not the layout.

25. **Layout positional modifiers** — layout nodes support `.before("target")`, `.after("target")`, `.replace("target")`, and `layout.remove("target")` for precise placement within the existing layout tree. Target is a field ID or tab ID; first match in tree order wins.

26. **Layout node access via `form.layout("nodeId")`** — `form.layout()` has two overloads: callback form appends nodes, string form accesses a named layout node. Named nodes (e.g., tabs with `id`) can be narrowed via `.as("tabs")` for type-specific mutations. Tabs handle exposes `.tab({...})` to add tabs and `.tab("id")` to access existing tabs (e.g., `.tab("seo").layout(...)` to append to a tab's layout).

27. **Tabs are layout-only, not field types** — tabs are purely visual grouping defined in the layout tree. They are not in the field map and produce no data in `getData()`. The field map contains only data fields. Modifiers target tabs via `form.layout("nodeId").as("tabs")`, not via `form.field()`.

28. **`.required()` is a first-class field concept** — separate from zod schemas. Checks for empty values before the schema runs. Exposes `field.vm.required: boolean` for renderer required indicators. Works without `.schema()`. Validation order: required check → zod schema → form-level rules. `.requiredWhen(fn, message)` provides conditional required via a MobX computed callback.
