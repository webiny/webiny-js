# FormModel Addendum — Advanced Patterns

Extends `form-builder-prd.md` with patterns discussed after the initial PRD. None of these change existing decisions — they layer on top.

---

## Page Settings Groups (buildForm Pattern)

### Problem

The Page Settings dialog is a tabbed form where each tab (General, SEO, Social, Schema) is a self-contained group of fields. Groups are contributed by different packages. Unlike page types (mutually exclusive), settings groups are additive — all contribute simultaneously.

### Design

Each group is a self-contained builder, not a modifier of an existing form:

```ts
export interface IPageSettingsGroup {
  name: string;
  label: string;
  description?: string;
  icon?: string;
  buildForm(form: IFormModel): void;
  mapFormData?(data: Record<string, unknown>, input: UpdatePageSettingsParams): void;
}
```

### buildForm vs modifyForm

Two verbs, two intents:

| Method       | Intent                                                | Use case                                                |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------- |
| `buildForm`  | "I own my section, I'm creating it."                  | Page settings groups, wizard steps                      |
| `modifyForm` | "Someone else owns the form, I'm contributing to it." | Cross-cutting modifiers (Language), page type providers |

Both call the same FormModel mutation API (`form.fields(...)`, `form.layout(...)`, etc.). The distinction is semantic — it tells the reader whether this code owns the form or contributes to someone else's.

### Presenter Assembly

The Presenter creates a shared FormModel and lets each group build its fields. The Presenter then assembles the tabs from group metadata:

```ts
private buildForm(): IFormModel {
    const form = this.factory.create({ fields: () => ({}) });

    const tabs = this.groups.map(group => {
        group.buildForm(form);
        return {
            id: group.name,
            label: group.label,
            description: group.description,
            icon: group.icon,
            layout: group.layout
        };
    });

    form.setLayout(layout => [layout.tabs(tabs)]);

    return form;
}
```

Fields live in a shared FormModel (enabling cross-field references and validation across tabs), but each group conceptually owns its section. The Presenter decides the visual treatment (tabs, accordion, stacked sections).

### View Mode Separation

The dialog/drawer choice is a view concern, not a form concern. The FormModel and Presenter are identical in both modes. Only the View component changes:

```tsx
// Same presenter VM, different chrome
const PageSettingsDialog = ({ vm }) => (
  <Dialog>
    <HorizontalTabs form={vm.form} />
  </Dialog>
);

const PageSettingsDrawer = ({ vm }) => (
  <Drawer>
    <VerticalSidebar form={vm.form} />
  </Drawer>
);
```

View mode is configured separately from the form:

```tsx
<PageEditorConfig>
  <PageSettings.ViewMode mode="drawer" />
</PageEditorConfig>
```

---

## Conditional Required (requiredWhen)

The main PRD already defines `requiredWhen` (see Validation section, `.requiredWhen(fn, message)`). This addendum adds the CMS mapping.

### CMS Mapping

A CMS field with a conditional `required` validator maps to `requiredWhen`:

```json
{
  "fieldId": "discountCode",
  "validation": [
    {
      "name": "required",
      "message": "Discount code is required",
      "settings": {
        "condition": {
          "target": "discountEnabled",
          "operator": "eq",
          "value": true
        }
      }
    }
  ]
}
```

When the `required` validator has a `settings.condition`, the conversion uses `.requiredWhen()` instead of `.required()`:

```ts
if (validator.name === "required" && validator.settings?.condition) {
  const { target, operator, value } = validator.settings.condition;
  formField.requiredWhen(
    form => evaluateCondition(form.getValue(target), operator, value),
    validator.message
  );
} else if (validator.name === "required") {
  formField.required(validator.message);
}
```

### Behavior Notes

- `requiredWhen` is separate from the rules system. Rules control `hide`/`disable`. `requiredWhen` controls validation behavior and visual indication (`field.vm.required`). Different concerns, different mechanisms.
- The `isRequired` computed on the field VM reactively flips as the condition changes, so the renderer can show/hide the required indicator on the label.

---

## Computed Fields

### Problem

Some field values are derived from other fields. Currently the only mechanism is `afterChange` on the source field, which is imperative and scattered.

### Design

Three related patterns:

| Pattern                         | Behavior                                    | User editable?          |
| ------------------------------- | ------------------------------------------- | ----------------------- |
| `computed(() => ...)`           | Always derived, always reactive             | No                      |
| `computedUntilDirty(() => ...)` | Derived until user edits, then user owns it | Yes, breaks the link    |
| `afterChange` on source         | Imperative push from source to target       | Yes (no automatic link) |

#### Always-computed

```ts
fullName: fields
  .text()
  .label("Full Name")
  .computed(() => {
    const first = this.form.getValue("firstName");
    const last = this.form.getValue("lastName");
    return `${first} ${last}`.trim();
  });
```

Behavior:

- Value is a MobX computed — re-derives automatically.
- Field is read-only by default (user can't edit, computation is source of truth).
- `getData()` includes computed values.
- `setData()` ignores incoming values for computed fields.
- Validation still applies to the computed result.

#### Computed until dirty

```ts
slug: fields
  .text()
  .label("Slug")
  .computedUntilDirty(() => slugify(this.form.getValue("title")));
```

Behavior:

- Initially derived from the computation.
- Once the user manually edits the field, the computation disconnects.
- Subsequent changes to source fields no longer affect this field.
- `setData()` re-engages the computation (fresh baseline = fresh link).
- This replaces the common pattern of `afterChange` + manual `dirty` check.

### CMS Mapping

```json
{
  "fieldId": "fullName",
  "type": "text",
  "computed": {
    "expression": "concat(firstName, ' ', lastName)"
  }
}
```

The expression language is evaluated at runtime. Computed fields are read-only by default.

---

## List Field Interaction

The main PRD defines list operations (`addItem`, `removeItem`, `moveItem`) and item identity. This section adds detail on programmatic interaction patterns.

### Adding Items

```ts
// Simple list
form.field("metaTags").as("object").addItem();

// Templated list (dynamic zone)
form.field("content").as("object").addItem({ _templateId: "hero" });
```

The FormModel internally:

- Creates a new item instance with its own field set (from field definition or template).
- Populates default values (including `defaultValue(() => generateId())` for hidden ID fields).
- Assigns a stable internal key for React rendering.
- Pushes to the observable items array.

### Navigating the Tree

Every level uses `.field(name)` consistently:

```ts
// Top-level
form.field("title");

// Nested object
form.field("seo").as("object").field("metaTitle");

// List item's field
form.field("metaTags").as("object").items[0].field("name");

// Deep nesting
form.field("content").as("object").items[2].field("hero").as("object").field("image");
```

Form, object field, and list item all implement the same field access interface. The generic renderer doesn't care about depth — it receives a scope and calls `.field()`.

### Programmatic Access by Index

```ts
form.field("metaTags").as("object").items[0].field("title").setValue("test");
```

### getData() Output

Flattens to the expected shape:

```json
{
  "metaTags": [
    { "name": "description", "content": "My page" },
    { "name": "keywords", "content": "webiny, cms" }
  ]
}
```

---

## Form Navigator

### Concept

A tree view of the entire form structure, with validation state at every level. Enables users to see the full form at a glance, identify which fields have errors, and click to navigate directly to any field — regardless of which tab or nesting level it's in.

### Data Source

The FormModel is already a tree. Each node exposes:

- `field.vm.label` — display name
- `field.vm.validation` — error state for leaf fields
- `field.hasErrors` — rollup for objects and lists (any descendant invalid?)
- `field.vm.visible` — skip hidden fields
- `field.type` — for icon selection
- `field.items` — for list children
- `field.fieldEntries` — for object children

### Validation Error Paths

The main PRD already defines `form.errors` with dotted paths (see Validation Flow and Error Surface). Two complementary access patterns:

- **Field VM** (`field.vm.validation`) — for inline error display in the renderer.
- **Flat error list** (`form.errors`) — for summary banners, tab badges, and the navigator.

---

## Field Focus with Container Reveal

### Problem

Clicking a field in the navigator (or an error in the summary banner) should scroll to that field in the form. But the field may be hidden inside an inactive tab or collapsed accordion section.

### Design

`field.focus()` walks up the layout tree and activates every ancestor container before focusing the field itself.

```ts
field.focus() {
    // 1. Find all layout containers that contain this field
    const containers = this.form.getLayoutAncestors(this.path);

    // 2. Activate each one
    for (const container of containers) {
        container.reveal();
    }

    // 3. Signal the renderer to focus
    this.focusRequested = true;
}
```

### Container Reveal

Each layout container type implements `reveal()`:

| Container   | reveal() behavior                                                     |
| ----------- | --------------------------------------------------------------------- |
| Tabs        | `this.activeTabId = tabId` — switches to the tab containing the field |
| Accordion   | `this.expandedSections.add(sectionId)` — expands the section          |
| Nested tabs | Each level activates independently                                    |

All state is MobX observable. `reveal()` just sets state — MobX batches the changes, React re-renders, and the correct tab/accordion is visible.

### Sequence

1. `field.focus()` called (from navigator, error banner, keyboard shortcut, programmatic)
2. Layout ancestors activated (tabs switch, accordions open) — synchronous state mutations
3. `focusRequested` set on the field
4. MobX batches all state changes into one render cycle
5. React renders: correct tab visible, accordion open
6. Field renderer picks up `focusRequested`, calls `scrollIntoView` + `focus()`
7. Field clears `focusRequested`

### Renderer Side

```tsx
const TextFieldRenderer = observer(({ field }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (field.vm.focusRequested) {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus();
      field.clearFocusRequest();
    }
  }, [field.vm.focusRequested]);

  return <Input ref={inputRef} {...field.vm} />;
});
```

### Depth Support

Works at arbitrary depth. A field inside tabs > tab > accordion > section gets revealed by each ancestor in order. The caller (navigator, error banner) just calls `field.focus()` and doesn't know about the layout structure.

---

## Tab Description Metadata

Tab definitions already support `description` in the main PRD (`TabDefinition.description`). This note clarifies usage:

- Vertical sidebar tab renderers (drawer-style settings) display the description below the tab label.
- Horizontal tab renderers may ignore it.

```ts
{
    id: "seo",
    label: "SEO",
    description: "Optimize how this page appears in search results.",
    icon: "search",
    layout: [ ... ]
}
```

---

## Decisions (addendum)

29. **Page settings groups are additive** — all groups' `buildForm` methods are called on a shared FormModel. Each group conceptually owns a tab.

30. **`buildForm` vs `modifyForm`** — two verbs for two intents. `buildForm` = "I own my section." `modifyForm` = "I'm contributing to someone else's form." Both use the same FormModel mutation API.

31. **`requiredWhen` is separate from the rules system** — rules control `hide`/`disable`. `requiredWhen` controls validation behavior and visual indication. Different concerns, different mechanisms.

32. **Computed fields are read-only by default** — `computed()` fields cannot be edited. `computedUntilDirty()` fields can be edited, which breaks the computation link. `setData()` re-engages the link.

33. **`field.focus()` is a model-level operation** — it activates layout containers (observable state) and signals the renderer. No DOM manipulation in the model.

34. **Container `reveal()` is type-specific** — tabs switch `activeTabId`, accordions expand sections. Each container type implements its own reveal behavior.

35. **View mode is a view concern** — the same FormModel and Presenter serve both dialog and drawer modes. Only the React view component changes.
