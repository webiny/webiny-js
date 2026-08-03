# CMS Preview SDK & Component Mapping System

## Problem Statement

Today, rendering CMS content entries on the frontend requires significant manual work: developers must write custom GraphQL queries with precise field selections, manually map dynamic zone (DZ) templates to React components using fragile string conventions (`__typename`), and build their own live preview integration from scratch. This creates a poor developer experience, is error-prone (any mismatch between CMS schema and frontend code silently breaks rendering), and makes live preview unreliable since `__typename` is a GraphQL read-only artifact that doesn't exist in form data.

The Website Builder (WB) already solves this problem for pages with its SDK architecture: automatic data fetching, a component catalog discovered via iframe bridge, and seamless live preview. CMS content entries deserve the same experience.

## Solution

Build a **CMS Preview SDK** — a separate package (`@webiny/cms-sdk` + framework bindings like `@webiny/cms-nextjs`) that mirrors the WB SDK architecture, adapted for headless CMS content entries:

1. **Automatic entry fetching** — The SDK fetches entries without custom GraphQL. It uses the existing Webiny SDK (`packages/sdk`) and the server-side `ValuesSelectionGenerator` to produce field lists automatically. Developers call `getEntry(modelId, entryId)` and get complete entry data. `ref` fields are excluded from auto-fetching initially; developers use the SDK directly where needed.

2. **Component mapping in the model editor** — Each DZ template in the CMS model definition gets a `componentName` field. When a model has a preview URL configured, the model editor opens a live iframe connection to that URL, discovers available frontend components via a bridge handshake (same protocol as WB), and lets the user select which component renders each template. This mapping is stored on the template and exposed via the existing `getContentModel` query.

3. **Live preview via iframe bridge** — When the SDK detects it's running inside the CMS editor iframe, it switches to editing mode (same environment detection as WB: `window.parent !== window`). The CMS editor sends the full entry data via postMessage on every field change. The SDK renders DZ templates using the stored component mapping, resolving `_templateId` to component directly — no `__typename` needed.

4. **Production rendering** — In non-iframe mode, the SDK fetches entries via the API (read API for published, manage API with `preview: true` for drafts) and renders DZ content using the same component mapping fetched from the model definition.

5. **SSR support from day one** — The SDK supports server-side rendering (Next.js App Router / RSC) using the same environment detection patterns the WB SDK already uses.

## User Stories

1. As a frontend developer, I want to install a CMS SDK package and render CMS entries without writing any GraphQL queries, so that I can focus on building components instead of managing data fetching.

2. As a frontend developer, I want to register my React components with the SDK (similar to WB's `createComponent`), so that the CMS model editor can discover them and content editors can map them to templates.

3. As a frontend developer, I want each route/page to declare its own set of available components, so that different content types use different component catalogs without global pollution.

4. As a content modeler, I want to configure a "Preview URL" on a content model, so that the CMS can connect to the frontend and discover available components.

5. As a content modeler, I want to see a list of available frontend components when editing a DZ template, so that I can select which component renders that template without involving a developer.

6. As a content modeler, I want the component mapping to be stored on the DZ template definition, so that it persists across sessions and is available to both the editor and the frontend.

7. As a content editor, I want to see a live preview of my CMS entry as I type, so that I can verify how content looks before publishing.

8. As a content editor, I want the live preview to update on every field change (not just after save), so that I get immediate visual feedback.

9. As a content editor, I want the live preview to correctly render dynamic zone templates as the right frontend components, so that the preview matches the production site.

10. As a frontend developer, I want the SDK to automatically fetch the template-to-component mapping from the CMS API, so that I don't maintain a manual mapping file.

11. As a frontend developer, I want to render entries that have no dynamic zones (just scalar fields like title, body, image), so that the preview URL and live preview work for all content models.

12. As a frontend developer, I want the SDK to support SSR (Next.js App Router), so that production pages are server-rendered for SEO and performance.

13. As a frontend developer, I want the SDK to work in three modes — live (production), preview (drafts), and editing (iframe) — detected automatically, so that the same code works across all contexts.

14. As a frontend developer, I want scalar fields (title, slug, images) to be accessible as plain data from the entry object, so that I control their layout while the SDK handles DZ component rendering.

15. As a content modeler, I want to see the component's input definitions (label, description) in the template editor when a component is mapped, so that I understand what the component expects.

16. As a frontend developer, I want to use `_templateId` (not `__typename`) as the template discriminator everywhere, so that rendering works consistently across GraphQL responses, form data, and live preview.

17. As a content modeler, I want the preview URL to be a single URL per model, so that configuration is straightforward.

18. As a frontend developer, I want ref fields to be excluded from automatic fetching, so that I can implement reference resolution explicitly where needed using the SDK.

19. As a content editor, I want the preview iframe to be embedded in the entry editor (like the existing live preview extension), so that I see content and preview side by side.

20. As a frontend developer, I want the component discovery to happen live (not cached), so that newly registered components appear immediately in the model editor.

## Implementation Decisions

### Packages

- **New package: `@webiny/cms-sdk`** — Core SDK with environment detection, bridge messaging, component registry, component resolver, and entry renderer logic. Separate from WB SDK but shares architectural patterns.
- **New package: `@webiny/cms-nextjs`** — Next.js framework binding with SSR support, React components (`<EntryRenderer>`), and hooks.
- **Existing package: `@webiny/sdk`** — Used as-is for API calls (getEntry, listEntries). The CMS SDK wraps it, adding automatic field selection.

### Component Discovery Protocol

- Reuses the same bridge architecture as WB: `Messenger` class with `postMessage`, origin validation, and pattern-matched event types.
- The CMS model editor (template editing dialog) opens an iframe to the model's preview URL.
- The frontend SDK detects the iframe context and sends `preview.component.register` messages for each registered component, including its name, label, and input definitions.
- The model editor populates a component picker dropdown from the received catalog.

### Component Mapping Storage

- Each `CmsDynamicZoneTemplate` gets a new `componentName: string` field.
- Stored in the model definition alongside existing template fields (`id`, `name`, `gqlTypeName`, `fields`, `layout`, etc.).
- Exposed via the existing `getContentModel` GraphQL query — no new endpoint needed.

### Model-Level Preview URL

- New `previewUrl: string` field on the `CmsModel.settings` type.
- Configured in the model editor UI.
- Used by the admin editor for iframe preview and component discovery.

### Entry Fetching

- The SDK uses the existing Webiny SDK's `getEntry`/`listEntries` methods.
- Field selection is generated automatically from the model definition — the SDK fetches the model's field list (via the existing `valuesSelection` or a similar mechanism) and passes it to the SDK's `fields` parameter.
- `ref` fields are skipped in automatic selection. Developers fetch references explicitly.
- `preview: true` flag on the SDK config switches to draft content access.

### Live Preview Data Flow

- In iframe/editing mode, the CMS entry editor sends the full entry form data to the iframe via postMessage on every field change.
- The SDK receives the data, matches DZ template values by `_templateId` to the model's template definitions, looks up the mapped `componentName`, resolves it against the registered component catalog, and renders.
- No `__typename` is needed anywhere in this flow.

### Component Resolution

- The SDK maintains a component registry (map of component name to React component + manifest).
- For each DZ value in the entry data, the SDK: (1) reads `_templateId`, (2) looks up the template in the model definition to get `componentName`, (3) resolves `componentName` in the component registry, (4) renders the component with the template's field values as props/inputs.

### SSR Support

- Uses the same environment detection as WB SDK (`isClient`, `isServer`, `isEditing`).
- Server-side rendering fetches entry data and renders components synchronously.
- Client-side hydration in editing mode enables the bridge for live updates.

## Testing Decisions

### What makes a good test

Tests should verify external behavior through public interfaces, not implementation details. A test should break only when the feature's contract changes, not when internal refactoring occurs.

### Modules to test

- **SDK automatic field list generation** — Given a model definition (with scalar fields, object fields, DZ fields with templates, nested DZs), verify the SDK produces the correct field list for the `getEntry` call. This is the core logic that eliminates manual GQL writing and must handle all field types correctly.

### Prior art

- `packages/api-headless-cms/__tests__/utils/contentModelToJsonSchema.test.ts` — tests model-to-schema conversion with similar field type coverage.
- `packages/api-headless-cms/__tests__/contentTraverser/` — tests entry traversal with DZ fields.
- `packages/sdk/__tests__/` — tests for the existing Webiny SDK methods.

## Out of Scope

- **Reference field auto-fetching** — `ref` fields require recursive fetching with potential circular references. Developers use the SDK directly for now.
- **WB SDK migration** — The WB SDK continues to work as-is. Extracting shared primitives (Messenger, Environment) into a common base package is a future optimization.
- **Inline visual editing** — Click-to-edit on individual fields within the preview (like Storyblok's click-to-edit). This PRD covers live preview only.
- **Component input validation** — Validating that the template's fields match the mapped component's expected inputs. This could be a future enhancement.
- **Multiple preview URLs per model** — Only one preview URL is supported per model. Multi-environment support can come later.
- **Custom field renderers in the SDK** — The SDK renders DZ templates via mapped components. Scalar fields are the developer's responsibility. Helper components (e.g., `<CmsImage />`) may come later.
- **Offline component catalog caching** — Component discovery is live-only via iframe. If the preview URL is down, no catalog is available.

## Further Notes

- The architecture closely mirrors the WB SDK (`ContentSdk`, `EditingSdk`, `LiveSdk`, `PreviewSdk`, `Messenger`, `ComponentRegistry`, `ComponentResolver`) but is purpose-built for CMS entries rather than WB page documents.
- The `_templateId` discriminator becomes the universal identifier for DZ template resolution — replacing `__typename` which is a GraphQL-only artifact. This is a philosophical shift: the CMS model definition is the source of truth for component mapping, not GraphQL type names.
- The existing `ValuesSelectionGenerator` on the server can be leveraged to provide field lists to the SDK, but the SDK may also generate its own field list from the model definition fetched via API — implementation will determine the best approach.
- The CMS live preview extension (`extensions/livePreview/`) serves as a reference implementation but will eventually be superseded by the SDK-based approach.
