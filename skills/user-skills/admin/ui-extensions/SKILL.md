---
name: webiny-admin-ui-extensions
context: webiny-extensions
description: >
  Customizing the Webiny Admin UI -- white-labeling, custom data list columns, page-type forms,
  and Lexical editor plugins. Use this skill when the developer wants to change branding (logo,
  title, theme colors), add custom columns to content entry list views, create custom forms
  for Website Builder page types, or extend the Lexical rich text editor. Covers AdminConfig,
  ContentEntryListConfig, Browser.Table.Column, Bind, useForm, and form validation.
---

# Admin UI Extensions

## TL;DR

Admin extensions customize the Webiny Admin application. There are three main categories: **white-labeling** (logos, titles, theme colors), **custom data list columns** (adding columns to content entry tables), and **custom page-type forms** (custom form fields for Website Builder page types). All are React components registered via `<Admin.Extension>` in `webiny.config.tsx`.

**YOU MUST include the full file path with the `.tsx` extension in every `src` prop.** For example, use `src={"/extensions/MyAdminExtension.tsx"}`, NOT `src={"/extensions/MyAdminExtension"}`. Omitting the file extension will cause a build failure.

## White-Labeling

### Theme Colors

```tsx
// extensions/AdminBranding/AdminTheme.tsx
import React from "react";
import { AdminConfig } from "webiny/admin/configs";

const { Theme } = AdminConfig;

const AdminTheme = () => {
  return (
    <AdminConfig.Public>
      <Theme.Color palette={"primary"} color={"purple"} />
      <Theme.Color palette={"secondary"} color={"green"} />
    </AdminConfig.Public>
  );
};

export default AdminTheme;
```

- `palette` -- `"primary"`, `"secondary"`, `"neutral"`, etc.
- `color` -- any CSS color value: named colors, hex (`"#6B46C1"`), or RGB.

### Logo and Title

```tsx
// extensions/AdminBranding/AdminTitleLogo.tsx
import React from "react";
import { AdminConfig } from "webiny/admin/configs";
import squareLogo from "./logo.png";
import horizontalLogo from "./logo.png";

const { Title, Logo } = AdminConfig;

const AdminTitleLogo = () => {
  return (
    <AdminConfig.Public>
      <Title value={"ACME Corp"} />
      <Logo
        squareLogo={<img src={squareLogo} alt={"ACME Corp"} />}
        horizontalLogo={<img src={horizontalLogo} alt={"ACME Corp"} />}
      />
    </AdminConfig.Public>
  );
};

export default AdminTitleLogo;
```

Register both:

```tsx
<Admin.Extension src={"/extensions/AdminBranding/AdminTheme.tsx"} />
<Admin.Extension src={"/extensions/AdminBranding/AdminTitleLogo.tsx"} />
```

### Available AdminConfig Components

| Component                                        | Purpose                         |
| ------------------------------------------------ | ------------------------------- |
| `<Theme.Color palette="..." color="..." />`      | Set theme color palette         |
| `<Title value="..." />`                          | Set the Admin app title         |
| `<Logo squareLogo={...} horizontalLogo={...} />` | Set square and horizontal logos |

All must be wrapped in `<AdminConfig.Public>`.

## Custom Data List Columns

Add custom columns to the content entry list view in the Admin UI. Columns can be restricted to specific content models.

### Full Example: Email Columns for Contact Submissions

```tsx
// extensions/contactSubmission/EmailEntryListColumn.tsx
import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";

const { Browser } = ContentEntryListConfig;

// Custom cell component for the Email Type column
interface ContactSubmissionTableRow {
  values: {
    emailType: "work" | "personal";
  };
}

export const EmailTypeCell = () => {
  const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
  const { row } = useTableRow<ContactSubmissionTableRow>();

  if (isFolderRow(row)) {
    return <>{"-"}</>;
  }

  const emailType = row.data.values.emailType;
  return emailType === "work" ? <>{"Business"}</> : <>{"Personal"}</>;
};

// Main extension component
const EmailEntryListColumn = () => {
  return (
    <ContentEntryListConfig>
      {/* Simple column using path (no custom cell needed) */}
      <Browser.Table.Column
        name={"email"}
        after={"name"}
        path={"values.email"}
        header={"Email"}
        modelIds={["contactSubmission"]}
      />
      {/* Custom cell column */}
      <Browser.Table.Column
        name={"emailType"}
        after={"email"}
        header={"Email Type"}
        modelIds={["contactSubmission"]}
        cell={<EmailTypeCell />}
      />
    </ContentEntryListConfig>
  );
};

export default EmailEntryListColumn;
```

Register:

```tsx
<Admin.Extension src={"/extensions/contactSubmission/EmailEntryListColumn.tsx"} />
```

### Column Props Reference

| Prop       | Type           | Description                                                               |
| ---------- | -------------- | ------------------------------------------------------------------------- |
| `name`     | `string`       | Unique column identifier                                                  |
| `header`   | `string`       | Column header text                                                        |
| `path`     | `string`       | Dot-path to the data field (e.g., `"values.email"`) -- for simple columns |
| `cell`     | `ReactElement` | Custom React component for complex rendering                              |
| `modelIds` | `string[]`     | Restrict column to specific content models                                |
| `after`    | `string`       | Position this column after another column by name                         |

### Custom Cell Hooks

Inside a custom `cell` component:

- `useTableRow<T>()` -- access the full row data, typed with your interface
- `isFolderRow(row)` -- check if the current row is a folder (return placeholder content)

## Custom Page-Type Forms

Create custom forms for Website Builder page types using Webiny's form components:

```tsx
// extensions/customPageTypes/RetailPageForm.tsx
import React from "react";
import { Grid, Input, Select } from "webiny/admin/ui";
import { pagePathFromTitle } from "webiny/admin/website-builder";
import type { FormApi } from "webiny/admin/form";
import { Bind, UnsetOnUnmount, useForm, validation } from "webiny/admin/form";

const generatePath = (form: FormApi) => () => {
  const title = form.getValue("properties.title");
  const language = form.getValue("extensions.language");

  const titlePath = pagePathFromTitle(title ?? "");
  const parts = [language, titlePath].filter(Boolean);

  form.setValue("properties.path", `/${parts.join("/")}`);
};

export const RetailPageForm = () => {
  const form = useForm();

  return (
    <>
      <Grid.Column span={12}>
        <UnsetOnUnmount name={"properties.title"}>
          <Bind name={"properties.title"} validators={[validation.create("required")]}>
            <Input label={"Title"} onBlur={generatePath(form)} />
          </Bind>
        </UnsetOnUnmount>
      </Grid.Column>
      <Grid.Column span={12}>
        <UnsetOnUnmount name={"extensions.language"}>
          <Bind
            name={"extensions.language"}
            validators={[validation.create("required")]}
            afterChange={generatePath(form)}
          >
            <Select
              placeholder={"Select a language"}
              label={"Language"}
              options={[
                { label: "English", value: "en" },
                { label: "German", value: "de" },
                { label: "French", value: "fr" }
              ]}
            />
          </Bind>
        </UnsetOnUnmount>
      </Grid.Column>
      <Grid.Column span={12}>
        <UnsetOnUnmount name={"properties.path"}>
          <Bind name={"properties.path"} validators={[validation.create("required")]}>
            <Input label={"Path"} />
          </Bind>
        </UnsetOnUnmount>
      </Grid.Column>
    </>
  );
};
```

### Form Components Reference

| Component / Hook | Import                | Purpose                                             |
| ---------------- | --------------------- | --------------------------------------------------- |
| `Bind`           | `"webiny/admin/form"` | Bind a form field to a name path                    |
| `useForm()`      | `"webiny/admin/form"` | Access the form API (`getValue`, `setValue`)        |
| `validation`     | `"webiny/admin/form"` | Create validators (`validation.create("required")`) |
| `UnsetOnUnmount` | `"webiny/admin/form"` | Clear the field value when the component unmounts   |
| `Grid.Column`    | `"webiny/admin/ui"`   | Layout grid column (`span={12}` for full width)     |
| `Input`          | `"webiny/admin/ui"`   | Text input field                                    |
| `Select`         | `"webiny/admin/ui"`   | Dropdown select with options                        |
| `FormApi`        | `"webiny/admin/form"` | Type for the form API object                        |

## Lexical Editor Plugins

Admin extensions can also add custom plugins to the Lexical rich text editor used in both the Headless CMS and the Website Builder. These are registered as `<Admin.Extension>` and use imports from `"webiny/admin/lexical"`, `"webiny/admin/cms/lexical"`, and `"webiny/admin/website-builder/lexical"`.

## Quick Reference

```
White-label import:  import { AdminConfig } from "webiny/admin/configs";
Data list import:    import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
Form imports:        import { Bind, useForm, validation } from "webiny/admin/form";
UI imports:          import { Grid, Input, Select } from "webiny/admin/ui";
Register:            <Admin.Extension src={"/extensions/MyAdminExtension.tsx"} />
Develop:             yarn webiny watch admin
Deploy:              yarn webiny deploy admin
```

## Related Skills

- `webiny-project-structure` -- How to register Admin extensions
- `webiny-full-stack-architect` -- Full-stack extension skeleton and registration
- `webiny-admin-architect` -- Admin-side architecture patterns (headless + presentation features)
