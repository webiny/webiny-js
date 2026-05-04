---
name: webiny-page-settings-extensions
context: webiny-extensions
description: >
  Extending the Website Builder page settings with custom settings groups and modifiers.
  Use this skill when the developer wants to add a new tab/group to the page settings
  drawer (e.g., Publishing, Analytics, Access Control), or modify an existing settings
  group (e.g., add fields to General or SEO). Covers PageSettingsGroup, PageSettingsGroupModifier,
  and the doc.extensions data model. For field types, renderers, and layout details,
  see the webiny-form-model skill.
---

# Page Settings Extensions

## TL;DR

Page settings extensions let you add new tabs to the page settings drawer or inject fields into existing tabs. Create a class implementing `PageSettingsGroup.Interface` for a new tab, or `PageSettingsGroupModifier.Interface` to extend an existing one. Register both via `createFeature()` and `<RegisterFeature>`. **Always store custom data in `doc.extensions` — never write to `doc.properties`, which is reserved for built-in system properties.**

**YOU MUST include the full file path with the `.tsx` extension in every `src` prop.** For example, use `src={"/extensions/myPageSettings/index.tsx"}`, NOT `src={"/extensions/myPageSettings/index"}`. Omitting the file extension will cause a build failure.

For field types, renderers, layout, validation, and all other form builder APIs, refer to the **webiny-form-model** skill.

## Important: Where to Store Data

> **Use `doc.extensions` for all custom data.** The `doc.properties` object holds built-in system properties (title, path, snippet, image, tags, seo, social). Writing custom fields into `doc.properties` risks naming collisions with future Webiny updates and can corrupt system behavior. Always namespace your data under `doc.extensions.<yourGroupName>`.

```typescript
// CORRECT — custom data in doc.extensions
mapFromForm(formData, doc) {
    doc.extensions.mySettings = doc.extensions.mySettings ?? {};
    doc.extensions.mySettings.myField = formData.myField;
}

// WRONG — never write custom data into doc.properties
mapFromForm(formData, doc) {
    doc.properties.myField = formData.myField; // DON'T DO THIS
}
```

## Adding a New Settings Group

A new settings group appears as its own tab in the page settings drawer. Implement `PageSettingsGroup.Interface` with these members:

| Member                       | Type                                        | Description                                               |
| ---------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `name`                       | `string`                                    | Unique group identifier (used as form field namespace)    |
| `label`                      | `string`                                    | Tab label shown in the UI                                 |
| `description`                | `string` (optional)                         | Description shown below the tab label                     |
| `icon`                       | `{ type: "icon", name: string }` (optional) | FontAwesome icon for the tab (e.g., `"fas/calendar-alt"`) |
| `buildForm(form)`            | method                                      | Define fields and layout                                  |
| `mapToForm(doc)`             | method                                      | Read from document to populate the form                   |
| `mapFromForm(formData, doc)` | method                                      | Write form values back to the document                    |

### Complete Example: Publishing Settings Group

```typescript
// extensions/myPageSettings/PublishingSettingsGroup.ts
import { PageSettingsGroup } from "webiny/admin/website-builder/page/editor";

class PublishingSettingsGroupImpl implements PageSettingsGroup.Interface {
  name = "publishing";
  label = "Publishing";
  description = "Configure publishing schedule and visibility.";
  icon = { type: "icon", name: "fas/calendar-alt" };

  buildForm(form: PageSettingsGroup.FormBuilder): void {
    form.fields(fields => ({
      publishDate: fields.datetime().withTimezone().label("Publish date"),
      unpublishDate: fields.datetime().dateOnly().label("Unpublish date"),
      visibility: fields
        .text()
        .label("Visibility")
        .options([
          { label: "Public", value: "public" },
          { label: "Private", value: "private" },
          { label: "Password Protected", value: "password" }
        ])
        .defaultValue("public"),
      featured: fields.boolean().label("Featured page")
    }));

    form.layout(layout => [
      layout.row("publishDate"),
      layout.row("unpublishDate"),
      layout.row("visibility"),
      layout.row("featured")
    ]);
  }

  mapToForm(doc: PageSettingsGroup.PageDocument): Record<string, any> {
    const publishing = doc.extensions?.publishing;
    return {
      publishDate: publishing?.publishDate ?? null,
      unpublishDate: publishing?.unpublishDate ?? null,
      visibility: publishing?.visibility ?? "public",
      featured: publishing?.featured ?? false
    };
  }

  mapFromForm(formData: Record<string, any>, doc: PageSettingsGroup.PageDocument): void {
    doc.extensions.publishing = doc.extensions.publishing ?? {};
    doc.extensions.publishing.publishDate = formData.publishDate;
    doc.extensions.publishing.unpublishDate = formData.unpublishDate;
    doc.extensions.publishing.visibility = formData.visibility;
    doc.extensions.publishing.featured = formData.featured;
  }
}

export const PublishingSettingsGroup = PageSettingsGroup.createImplementation({
  implementation: PublishingSettingsGroupImpl,
  dependencies: []
});
```

## Modifying an Existing Settings Group

A modifier injects fields into an existing tab without subclassing it. Implement `PageSettingsGroupModifier.Interface`:

| Member                       | Type              | Description                                                             |
| ---------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `group`                      | `string`          | Name of the target group (`"general"`, `"seo"`, `"social"`, `"schema"`) |
| `modifyForm(form)`           | method            | Add fields and layout entries to the existing group                     |
| `mapToForm(doc)`             | method (optional) | Supply values for the new fields                                        |
| `mapFromForm(formData, doc)` | method (optional) | Persist the new field values                                            |

### Complete Example: Add Expiration Date to the General Tab

```typescript
// extensions/myPageSettings/GeneralSettingsModifier.ts
import { PageSettingsGroupModifier } from "webiny/admin/website-builder/page/editor";

class GeneralSettingsModifierImpl implements PageSettingsGroupModifier.Interface {
  group = "general";

  modifyForm(form: PageSettingsGroupModifier.FormBuilder): void {
    form.fields(fields => ({
      expirationDate: fields
        .datetime()
        .monthOnly()
        .label("Expiration month")
    }));

    // .after("snippet") places the field after the "snippet" field in the General tab
    form.layout(layout => [layout.row("expirationDate").after("snippet")]);
  }

  mapToForm(doc: PageSettingsGroupModifier.PageDocument): Record<string, any> {
    return {
      expirationDate: doc.extensions?.expirationDate ?? null
    };
  }

  mapFromForm(formData: Record<string, any>, doc: PageSettingsGroupModifier.PageDocument): void {
    doc.extensions.expirationDate = formData.expirationDate;
  }
}

export const GeneralSettingsModifier = PageSettingsGroupModifier.createImplementation({
  implementation: GeneralSettingsModifierImpl,
  dependencies: []
});
```

## Feature Registration

Wrap your group and/or modifier in a feature and export a React component:

```tsx
// extensions/myPageSettings/index.tsx
import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { PublishingSettingsGroup } from "./PublishingSettingsGroup.js";
import { GeneralSettingsModifier } from "./GeneralSettingsModifier.js";

const MyPageSettingsFeature = createFeature({
  name: "MyPageSettings",
  register(container) {
    container.register(PublishingSettingsGroup);
    container.register(GeneralSettingsModifier);
  }
});

export default () => {
  return <RegisterFeature feature={MyPageSettingsFeature} />;
};
```

Register in `webiny.config.tsx`:

```tsx
<Admin.Extension src={"/extensions/myPageSettings/index.tsx"} />
```

## Layout Positioning in Modifiers

When modifying an existing group, use `.after("existingFieldName")` to position your new fields relative to built-in fields. The built-in field names for each group:

- **general**: `title`, `path`, `snippet`, `image`, `tags`
- **seo**: `title`, `description`, `metaTags`, `canonicalUrl`, `noIndex`, `noFollow`
- **social**: `title`, `description`, `image`, `metaTags`
- **schema**: `structuredSchema`

## The Page Document Model

The `doc` parameter in `mapToForm` / `mapFromForm` has three top-level namespaces:

```typescript
interface IPageDocument {
    properties: { ... };   // SYSTEM — title, path, snippet, seo, social, etc.
    metadata: { ... };     // SYSTEM — document metadata
    extensions: { ... };   // YOUR DATA — use this for all custom fields
}
```

**Reminder**: `doc.properties` and `doc.metadata` are managed by the system. Always read/write your custom data via `doc.extensions`. Namespace it under your group name to avoid collisions with other extensions (e.g., `doc.extensions.publishing`, `doc.extensions.analytics`).

## Related Skills

- **webiny-form-model** — Field types, renderers, layout, validation, conditional rules, computed fields, and dynamic zones
