---
name: webiny-website-builder
context: webiny-extensions
description: >
  Building Website Builder editor components, theming, and CMS integration using
  @webiny/website-builder-nextjs. Use this skill when the developer wants to create editor
  components for the Website Builder, register components with createComponent, define
  configurable inputs (text, number, boolean, color, select, file, slot, lexical),
  set up component groups, customize the theme (CSS variables, createTheme, Tailwind bridge,
  fonts), build Server Components that fetch CMS data, or understand the WB architecture
  (Admin iframe + Next.js). Also use for anything related to the Website Builder starter kit.
---

# Website Builder

## TL;DR

The Webiny Website Builder uses a unique architecture: the Admin editor loads your Next.js app inside an iframe. All component code and styles live in your Next.js project -- Webiny only stores the page structure (which components and what input values). You build editor components with `@webiny/website-builder-nextjs`, register them via `createComponent()`, define configurable inputs, and manage theming through CSS custom properties and `createTheme()`.

## Architecture

```
+----------------------------------------------------------+
|  Webiny Admin                                            |
|  +----------------------------------------------------+  |
|  |  Website Builder Editor                            |  |
|  |                                                    |  |
|  |   sidebar     +------------------------------+     |  |
|  |   (inputs)    |  your Next.js app (iframe)   |     |  |
|  |               |  real components             |     |  |
|  |               |  real styles                 |     |  |
|  |               +------------------------------+     |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
                        postMessage (SDK)
+----------------------------------------------------------+
|  Your Next.js App (running separately)                   |
|  @webiny/website-builder-nextjs SDK installed            |
+----------------------------------------------------------+
```

Key implications:

- **No style clashes** -- your components, your styles, full ownership
- **Genuine WYSIWYG** -- editors see your real app, not a simulation
- **Framework-owned code** -- all React components live in your Next.js repo

## Setup

### Starter Kit

```bash
git clone https://github.com/webiny/website-builder-nextjs.git my-website
cd my-website
npm install
```

Ensure `@webiny/website-builder-nextjs` and `@webiny/sdk` versions in `package.json` match your Webiny version (`yarn webiny --version` in your Webiny project).

### Environment Variables

```dotenv
# .env
NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY=your_wb_api_key
NEXT_PUBLIC_WEBSITE_BUILDER_API_HOST=https://your-cloudfront-url.cloudfront.net
NEXT_PUBLIC_WEBSITE_BUILDER_ADMIN_HOST=http://localhost:3001
NEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT=root
```

## Editor Components

An editor component has two parts:

1. **React component** -- renders the UI, receives configured values via `inputs` prop
2. **Manifest** -- metadata (name, label, group, inputs) that tells the editor about the component

### Creating a Component

```tsx
// src/editorComponents/Banner.tsx
import React from "react";
import { ComponentProps } from "@webiny/website-builder-nextjs";

interface BannerInputs {
  headline: string;
  ctaLabel: string;
  ctaUrl: string;
}

export function Banner({ inputs: { headline, ctaLabel, ctaUrl } }: ComponentProps<BannerInputs>) {
  return (
    <div className="bg-primary py-12 px-6 text-center text-white">
      <h2 className="text-3xl font-bold mb-4">{headline}</h2>
      {ctaLabel && ctaUrl && (
        <a
          href={ctaUrl}
          className="inline-block bg-white text-primary font-semibold px-6 py-3 rounded-md"
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
}
```

### Registering Components

The `editorComponents` array must be in a `"use client"` file:

```tsx
// src/editorComponents/index.tsx
"use client";
import { createComponent, createTextInput } from "@webiny/website-builder-nextjs";
import { Banner } from "./Banner";

export const editorComponents = [
  createComponent(Banner, {
    name: "Custom/Banner",
    label: "Banner",
    group: "custom",
    inputs: [
      createTextInput({
        name: "headline",
        label: "Headline",
        description: "The main headline text.",
        defaultValue: "Ready to get started?"
      }),
      createTextInput({
        name: "ctaLabel",
        label: "Button Label",
        defaultValue: "Get started"
      }),
      createTextInput({
        name: "ctaUrl",
        label: "Button URL",
        defaultValue: "/"
      })
    ]
  })
];
```

**Important:** The `"use client"` directive is required because component registration communicates with the editor via the browser. However, components imported here can still be Server Components if they don't have their own `"use client"` directive.

### Component Name Convention

Use a namespaced string: `"YourNamespace/ComponentName"`. Component names are stored in page documents -- treat them as **stable identifiers**; renaming breaks existing pages.

## Input Types

| Factory Function      | Use Case                            |
| --------------------- | ----------------------------------- |
| `createTextInput`     | Single-line text, URLs, labels      |
| `createLongTextInput` | Multi-line text                     |
| `createNumberInput`   | Numeric values                      |
| `createBooleanInput`  | Toggle / checkbox                   |
| `createColorInput`    | Color picker                        |
| `createDateInput`     | Date / date-time picker             |
| `createSelectInput`   | Dropdown with predefined options    |
| `createRadioInput`    | Radio button group                  |
| `createTagsInput`     | List of tags                        |
| `createObjectInput`   | Nested object (group of sub-inputs) |
| `createLexicalInput`  | Rich text (Lexical editor)          |
| `createFileInput`     | File / media picker                 |
| `createSlotInput`     | Slot for nesting other components   |

Each factory accepts: `name`, `label`, `description`, `defaultValue`, and type-specific options.

## Component Groups

Groups organize the editor's component palette:

```typescript
// src/contentSdk/groups.ts
import { registerComponentGroup, type ComponentManifest } from "@webiny/website-builder-nextjs";

export const registerComponentGroups = () => {
  registerComponentGroup({
    name: "basic",
    label: "Basic",
    description: "Components for simple content creation"
  });
  registerComponentGroup({
    name: "custom",
    label: "Custom",
    description: "Assorted custom components",
    filter: (component: ComponentManifest) => !component.group
  });
};
```

The `filter` option creates a catch-all group for components without an explicit `group`.

## Theming

The theme system has three files that work together:

### 1. `theme.css` -- CSS Custom Properties

```css
/* src/theme/theme.css */
@import "@webiny/website-builder-nextjs/lexical.css";

:root {
  --wb-theme-color-primary: #4632f5;
  --wb-theme-color-secondary: #00ccb0;
  --wb-theme-color-background: #ffffff;
  --wb-theme-color-surface: #f9f9f9;
  --wb-theme-color-text-base: #0a0a0a;
  --wb-theme-color-text-muted: #6b7280;
  --wb-theme-color-border: #e5e7eb;
  --wb-theme-font-family: "Inter", sans-serif;
}

.wb-heading-1 {
  font-weight: 700;
  line-height: 1.2;
  font-size: clamp(2rem, 1.5rem + 1.5vw, 3rem);
}

.wb-paragraph-1 {
  font-weight: 400;
  line-height: 1.6;
  font-size: clamp(0.95rem, 0.9rem + 0.25vw, 1rem);
}
```

### 2. `theme.ts` -- Theme Registration

```typescript
// src/theme/theme.ts
import { createTheme } from "@webiny/website-builder-nextjs";

declare const __THEME_CSS__: string;
export const css = __THEME_CSS__;

export const theme = createTheme({
  css,
  fonts: ["https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"],
  colors: [
    { id: "color-primary", label: "Primary", value: "var(--wb-theme-color-primary)" },
    { id: "color-secondary", label: "Secondary", value: "var(--wb-theme-color-secondary)" },
    { id: "color-background", label: "Background", value: "var(--wb-theme-color-background)" },
    { id: "color-text-base", label: "Text", value: "var(--wb-theme-color-text-base)" }
  ],
  typography: {
    headings: [{ id: "heading1", label: "Heading 1", tag: "h1", className: "wb-heading-1" }],
    paragraphs: [{ id: "paragraph1", label: "Paragraph 1", tag: "p", className: "wb-paragraph-1" }],
    quotes: [{ id: "quote", label: "Quote", tag: "blockquote", className: "wb-blockquote-1" }],
    lists: [{ id: "list1", label: "List 1", tag: "ul", className: "wb-unordered-list-1" }]
  }
});
```

- `colors` populates the editor's color picker
- `typography` populates the editor's typography toolbar
- `fonts` injects fonts into the editor iframe

### 3. `tailwind.css` -- Tailwind Bridge

```css
/* src/theme/tailwind.css */
@import "tailwindcss";

@theme inline {
  --font-sans: InterVariable, sans-serif;
  --color-primary: var(--wb-theme-color-primary);
  --color-secondary: var(--wb-theme-color-secondary);
  --color-text-base: var(--wb-theme-color-text-base);
}
```

This bridges WB CSS variables to Tailwind tokens, enabling `bg-primary`, `text-primary`, etc. in your components.

### Changing Fonts (4 Files)

When switching fonts, update all four places:

| File                     | What to Update                                                            |
| ------------------------ | ------------------------------------------------------------------------- |
| `src/app/layout.tsx`     | Font import and config (e.g., `import { Geist } from "next/font/google"`) |
| `src/theme/tailwind.css` | `--font-sans` token                                                       |
| `src/theme/theme.css`    | `--wb-theme-font-family` variable                                         |
| `src/theme/theme.ts`     | `fonts` array URL (must include same weight range as layout.tsx)          |

## Server Components Fetching CMS Data

Build editor components that fetch data from the Headless CMS at render time:

```tsx
// src/editorComponents/ProductListing.tsx
import React from "react";
import { ComponentProps } from "@webiny/website-builder-nextjs";
import { sdk } from "@/lib/webiny";
import type { Product } from "@/lib/types";
import type { CmsEntryData } from "@webiny/sdk";

interface ProductListingInputs {
  heading: string;
  limit: string;
}

export async function ProductListing({
  inputs: { heading, limit }
}: ComponentProps<ProductListingInputs>) {
  const parsedLimit = parseInt(limit, 10) || 6;

  const result = await sdk.cms.listEntries<Product>({
    modelId: "product",
    limit: parsedLimit,
    sort: ["values.name_ASC"]
  });

  if (!result.isOk()) {
    return <div className="text-red-600">Failed to load products: {result.error.message}</div>;
  }

  const products: CmsEntryData<Product>[] = result.value.data;

  return (
    <section className="py-12 px-6">
      {heading && <h2 className="text-3xl font-bold text-center mb-8">{heading}</h2>}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {products.map(product => (
          <li key={product.id} className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold">{product.values.name}</h3>
            <p className="text-lg font-bold mt-2">${product.values.price.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Register it (async Server Components work even though `index.tsx` is `"use client"`):

```tsx
createComponent(ProductListing, {
  name: "Custom/ProductListing",
  label: "Product Listing",
  inputs: [
    createTextInput({ name: "heading", label: "Section Heading", defaultValue: "Our Products" }),
    createTextInput({ name: "limit", label: "Number of products", defaultValue: "6" })
  ]
});
```

To use the Headless CMS SDK, initialize it in `src/lib/webiny.ts` with a **Read API** key (see the `webiny-sdk` skill).

## Data Flow

```
Editor -> saves page document to Webiny API
           (document: component name + input values)

Next.js request/build
  -> contentSdk.getPage("/slug") -> returns page document
  -> DocumentRenderer matches component name to React component
  -> Component renders (Server Component may fetch CMS data)
```

## Quick Reference

```
SDK package:      @webiny/website-builder-nextjs
Component type:   import { ComponentProps } from "@webiny/website-builder-nextjs";
Registration:     createComponent(ReactComponent, { name, label, inputs })
Input factories:  createTextInput, createNumberInput, createBooleanInput, etc.
Theme:            createTheme({ css, fonts, colors, typography })
Groups:           registerComponentGroup({ name, label, description })
```

## Related Skills

- `webiny-sdk` -- Using the Headless CMS SDK inside Website Builder components
- `webiny-project-structure` -- Webiny project setup and extension registration
