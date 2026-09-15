---
name: webiny-new-entry-wizard
description: >
  Building a New Entry Wizard for the Headless CMS. Use this skill when the developer wants to
  show a custom wizard UI before the entry form when creating new CMS entries -- collecting
  fields like title, slug, or category upfront, then pre-filling the entry form. Covers
  ContentEntryEditorConfig.NewEntryWizard, createFeature, FormModelFactory, createReactiveComponent,
  useContentEntryFormPresenter, and the dirty-flag on setData.
---

# New Entry Wizard

## TL;DR

A New Entry Wizard intercepts the "create new entry" flow in the Headless CMS and shows a custom form before the full entry editor. The wizard collects initial values (title, slug, category, etc.), then calls `formPresenter.newEntry(initialValues)` to pre-fill the entry form and transition to the editor. The form is automatically marked as dirty so the user sees unsaved changes.

A wizard extension has five files:

1. **`abstractions.ts`** -- DI token and presenter interface (ALWAYS a standalone file)
2. **`feature.ts`** -- `createFeature` wiring (ALWAYS a standalone file)
3. **Presenter** -- owns the wizard form (fields, layout, validation) via `FormModelFactory`
4. **View** -- renders the wizard UI using `FormView` and `FormErrors`
5. **Registration** -- plugs the wizard into specific content models via `ContentEntryEditorConfig.NewEntryWizard`

## Registration

```tsx
// extensions/myWizard/index.tsx
import React from "react";
import { RegisterFeature } from "webiny/admin";
import { ContentEntryEditorConfig } from "webiny/admin/cms/entry/editor";
import { MyWizardFeature } from "./feature.js";
import { MyWizardForm } from "./MyWizardForm.js";

const MyWizardExtension = () => {
  return (
    <>
      <RegisterFeature feature={MyWizardFeature} />
      <ContentEntryEditorConfig>
        <ContentEntryEditorConfig.NewEntryWizard
          element={<MyWizardForm />}
          modelIds={["article", "blogPost"]}
        />
      </ContentEntryEditorConfig>
    </>
  );
};

export default MyWizardExtension;
```

### Props

| Prop       | Type                 | Description                                                                         |
| ---------- | -------------------- | ----------------------------------------------------------------------------------- |
| `element`  | `React.ReactElement` | The wizard component to render                                                      |
| `modelIds` | `string[]`           | Content model IDs this wizard applies to. Omit or pass `[]` to apply to all models. |

### Enabling the extension

```tsx
// webiny.config.tsx
<Admin.Extension src={"@/extensions/myWizard/index.tsx"} />
```

## Abstractions

Abstractions MUST live in a dedicated `abstractions.ts` file. This file defines the DI token for the presenter. It is imported by both the feature and the view.

```typescript
// extensions/myWizard/abstractions.ts
import { createAbstraction } from "webiny/admin";
import type { FormModel } from "webiny/admin/form";

export interface MyWizardVM {
  form: FormModel.FormVM;
  data: Record<string, unknown>;
}

export interface IMyWizardPresenter {
  vm: MyWizardVM;
  submit(): Promise<Record<string, unknown> | false>;
  reset(): void;
}

export const MyWizardPresenter = createAbstraction<IMyWizardPresenter>("MyWizardPresenter");
```

## Feature

The feature MUST live in a dedicated `feature.ts` file. It wires the presenter implementation to the abstraction and defines how the feature is resolved from the DI container.

```typescript
// extensions/myWizard/feature.ts
import { createFeature, FormModelFactory } from "webiny/admin";
import { MyWizardPresenter } from "./abstractions.js";
import { MyWizardPresenterImpl } from "./MyWizardPresenter.js";

export const MyWizardFeature = createFeature({
  name: "MyWizard",
  register(container) {
    container.register(
      MyWizardPresenter.createImplementation({
        implementation: MyWizardPresenterImpl,
        dependencies: [FormModelFactory]
      })
    );
  },
  resolve(container) {
    return { presenter: container.resolve(MyWizardPresenter) };
  }
});
```

## Presenter

The presenter owns a `FormModel` for the wizard's own fields. It is a plain class -- the DI token lives in `abstractions.ts` and the feature wiring lives in `feature.ts`.

```typescript
// extensions/myWizard/MyWizardPresenter.ts
import type { FormModel } from "webiny/admin/form";
import { makeAutoObservable, toJS } from "mobx";
import { FormModelFactory } from "webiny/admin";
import type { IMyWizardPresenter, MyWizardVM } from "./abstractions.js";

export class MyWizardPresenterImpl implements IMyWizardPresenter {
  private form: FormModel.Interface;

  constructor(formFactory: FormModelFactory.Interface) {
    this.form = formFactory.create({
      fields: fields => ({
        title: fields.text().label("Title").required("Title is required"),
        slug: fields.text().label("Slug").required("Slug is required"),
        category: fields
          .text()
          .label("Category")
          .options([
            { label: "News", value: "news" },
            { label: "Tutorial", value: "tutorial" }
          ])
      }),
      layout: layout => [layout.row("title"), layout.row("slug"), layout.row("category")]
    });

    makeAutoObservable(this);
  }

  get vm(): MyWizardVM {
    return {
      form: this.form.vm,
      data: toJS(this.form.getData())
    };
  }

  async submit(): Promise<Record<string, unknown> | false> {
    return this.form.submit();
  }

  reset(): void {
    this.form.reset();
  }
}
```

The presenter uses the same `FormModel` system as all Webiny forms. See the `webiny-form-model` skill for field types, renderers, layout options, and validation.

## View

The view renders the wizard form and handles submission. On submit, it calls `formPresenter.newEntry(initialValues)` to transition from the wizard to the entry editor with pre-filled values.

```tsx
// extensions/myWizard/MyWizardForm.tsx
import React, { useCallback } from "react";
import { useFeature, createReactiveComponent } from "webiny/admin";
import { useContentEntryFormPresenter } from "webiny/admin/cms/entry/editor";
import { FormView, FormErrors } from "webiny/admin/form";
import { Button } from "webiny/admin/ui";
import { MyWizardFeature } from "./feature.js";

export const MyWizardForm = createReactiveComponent(() => {
  const { presenter } = useFeature(MyWizardFeature);
  const formPresenter = useContentEntryFormPresenter();

  const handleSubmit = useCallback(async () => {
    const data = await presenter.submit();
    if (data !== false) {
      formPresenter.newEntry({
        title: data.title,
        settings: {
          general: {
            slug: data.slug
          }
        }
      });
    }
  }, [presenter, formPresenter]);

  const { form } = presenter.vm;

  return (
    <div className="flex justify-center pt-xl">
      <div className="bg-neutral-base rounded-lg p-lg flex flex-col gap-md" style={{ width: 600 }}>
        <h3 className="text-lg font-semibold">Create New Article</h3>
        <FormErrors form={form} />
        <FormView name="MyWizard" form={form} />
        <div className="flex justify-end gap-sm">
          <Button variant="primary" onClick={handleSubmit}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
});
```

## Key APIs

### `formPresenter.newEntry(initialValues?)`

Called from the wizard view to transition to the entry editor. When `initialValues` is provided, the entry form is pre-filled and marked as dirty (unsaved changes). The values map to the content model's field structure.

```typescript
formPresenter.newEntry({
  title: "My Article",
  description: "A short description",
  settings: {
    general: {
      slug: "my-article"
    }
  }
});
```

### `createReactiveComponent`

Wraps a component so it re-renders when MobX observables (like `presenter.vm`) change. Always use this for wizard views that read from a presenter.

### `useContentEntryFormPresenter()`

Returns the content entry form presenter. Used inside the wizard to call `newEntry()` after the wizard form is submitted.

### `useFeature(feature)`

Resolves the feature from the DI container. Returns the object produced by the feature's `resolve()` callback.

## How It Works

1. User clicks "New Entry" -- the route sets `id=new`
2. If a `NewEntryWizard` is configured for the current model, the wizard element renders instead of the entry form
3. The wizard collects data via its own `FormModel` and validates on submit
4. On successful submit, the wizard calls `formPresenter.newEntry(initialValues)`
5. This creates the entry form, pre-fills it with `setData(initialValues, { dirty: true })`, and the view switches from the wizard to the entry editor
6. The entry form shows as dirty -- the user can review and save

## File Structure

```
extensions/myWizard/
  index.tsx              -- registration (NewEntryWizard config + RegisterFeature)
  abstractions.ts        -- DI token + presenter interface (ALWAYS a standalone file)
  feature.ts             -- createFeature wiring (ALWAYS a standalone file)
  MyWizardPresenter.ts   -- presenter implementation (FormModel, business logic)
  MyWizardForm.tsx       -- view (createReactiveComponent, FormView, submit handler)
```

**Iron rule:** `abstractions.ts` and `feature.ts` are ALWAYS separate, standalone files. Never inline abstractions or feature definitions into the presenter or view.
