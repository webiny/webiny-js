# Theme App — Investigation Report

Branch: `next` · Date: 2026-08-01 · Status: pre-implementation, no code written.

Sources: repo skills at `skills/user-skills/**` (see note below), CodeGraph index, and direct
reading of `packages/**` on `next`.

## Decisions taken (2026-08-01)

| Decision                   | Outcome                                                                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package naming             | **`theme`** — `@webiny/theme-common`, `@webiny/api-theme`, `@webiny/app-theme`, `@webiny/theme-tailwind`, `@webiny/api-theme-extraction`. No bare `Theme` export anywhere; internal types are `ThemeDocument`, `DesignTokens`, `CanonicalSlot`, `TokenReference`. |
| Packaging                  | **Hardwired core** — one line in `registerApiRequestStack.ts`, one `<Theme />` in `Admin.tsx`. Consumers may depend on theme policy unconditionally.                                                                                                              |
| Multi-tenant frontend      | **Descoped** (§3.2). Theme follows the app's single configured `apiTenant`.                                                                                                                                                                                       |
| Component library contract | **Deferred** (§1.13, §3.8). Not a v1 concern.                                                                                                                                                                                                                     |
| Starting point             | **Phase 1, steps 1.1–1.5 first** — pure functions in `theme-common`, unit-tested — then 1.6–1.14.                                                                                                                                                                 |

> **Source note / first conflict.** `CLAUDE.md` instructs me to use a `webiny` MCP server via
> `list_webiny_skills` / `get_webiny_skill`. That server is **not configured** — `.mcp.json` only
> registers `stdlib` and `codegraph`. The authoritative skills do exist in-repo at
> `skills/user-skills/**` (69 `SKILL.md` files) and I used those. Either the MCP server needs
> re-adding to `.mcp.json` or `CLAUDE.md` should point at the repo path.

---

## 1. Findings

### 1.1 Module and package structure

There are **two** first-party packaging models in the monorepo, and both are "core".

**(a) Hardwired core** — the Website Builder model.

| Concern               | Location                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| API package           | `@webiny/api-website-builder` (`packages/api-website-builder`)                                   |
| Admin package         | `@webiny/app-website-builder` (`packages/app-website-builder`)                                   |
| API registration      | `packages/api-event-handler-core/src/registerApiRequestStack.ts:109`                             |
| Admin registration    | `packages/app-serverless-cms/src/Admin.tsx:55`                                                   |
| Public export surface | `packages/webiny/src/api/website-builder/*.ts`, `packages/webiny/src/admin/website-builder/*.ts` |

`registerApiRequestStack.ts` is an explicitly order-sensitive composition root shared by all
transports (AWS + self-hosted server). A new core module gets one line there.
`Admin.tsx` is the Admin composition root — one `<Extension />` element.

**(b) First-party extension** — the AI Power-Ups model, and the closest analogue to what we're
building on the _AI + background task + websocket_ axis.

`@webiny/ai-powerups` is a **single package** holding both sides (`src/api`, `src/admin`) with a
top-level component that registers them through the normal extension entry points:

```tsx
// packages/ai-powerups/src/AiPowerups.tsx
<Api.Extension   src={import.meta.dirname + "/api/Extension.js"} />
<Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
```

registered in `packages/project-template-base/src/DefaultExtensions.tsx:17` alongside
`<Languages />` and `<TenantManager />`.

**(c) Single package, split subpath exports** — `@webiny/webhooks` (`./api`, `./admin/*`) and
`@webiny/background-tasks` (`./api`, `./admin/*`). Same repo, one package, two runtimes.

**Admin module anatomy** (`packages/app-website-builder/src/Extension.tsx`, 158 lines) — this is
the template for the Theme app's Admin entry point:

- `<RegisterFeature feature={…} />` for each headless/presentation feature
- `<AdminConfig>` containing:
  - `<Security.Permissions name schema={…} />` — renders the permission UI in Admin security
  - `<Menu name parent element={<Menu.Link … />} />` — nav
  - `<Route route={…} element={…} />` — routing (`~/routes.ts`)
  - `<Dashboard.Widget />` — dashboard tiles
- `<HasPermission entity="page">…</HasPermission>` wrappers gate menus/routes client-side

Architecture inside each side is prescribed by the skills and matches the code:
`skills/user-skills/api/api-architect/SKILL.md` (features = business capability, `createFeature`,
`createAbstraction`, UseCase transient / Service+Repository singleton, `Result<T,E>`, domain errors
extending `BaseError`) and `skills/user-skills/admin/admin-architect/SKILL.md` (`features/` headless
vs `presentation/` with MobX presenters, mandatory `resolve()` on every feature, `useFeature()` as
the React bridge).

**Note:** `packages/api-collaboration` and `packages/app-collaboration` contain only stale `dist/`
— that work is not on `next`.

### 1.2 Data layer and versioning

**Everything is a Headless CMS entry, including Website Builder pages.** There is no separate
entity/table layer to learn.

`packages/api-website-builder/src/domain/page/page.model.ts` — the whole model, 28 lines:

```ts
export const PAGE_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS ? "wbPage" : "wbyWbPage";

const model = builder.private({ modelId: PAGE_MODEL_ID, name: "Website Builder - Page" });
model.fields(fields => ({
  properties: fields.searchableJson(),
  metadata: fields.searchableJson(),
  bindings: fields.json(),
  elements: fields.json(),
  extensions: fields.searchableJson()
}));
```

A **private** model (`builder.private(...)`) is not exposed on the CMS GraphQL endpoint and doesn't
appear in the CMS UI. Registered via `container.register(PageModelPlugin)` in
`WebsiteBuilderFeature.ts:76`.

**Key structure and revisions** come free from the CMS entry
(`packages/api-headless-cms/src/types/types.ts:258`+):

- `entryId` — stable across all revisions
- `id` — `entryId#version` (the revision key)
- `version: number`, `status`, `locked: boolean`
- `live: { version } | null` — **the published pointer**, per entry
- full revision-level metadata (`revisionCreatedOn/By`, `revisionFirstPublishedOn`, …)

Domain shape in `packages/api-website-builder/src/domain/page/abstractions.ts:22`.

**Publish** is `PublishEntryUseCase` from
`@webiny/api-headless-cms/features/contentEntry/PublishEntry`, wrapped in a repository
(`features/pages/PublishPage/PublishPageRepository.ts`) and a use case that adds permissions +
before/after events (`PublishPageUseCase.ts`). Revisions are created with
`CreatePageRevisionFrom`, listed with `GetPageRevisions`.

**Model instances are resolved per request.** `WebsiteBuilderFeature.ts:127-143` registers a
`RequestContextInitializer` that resolves `GetModelUseCase` inside
`identityContext.withoutAuthorization()` and does `requestContainer.registerInstance(PageModel, …)`.
Repositories then inject `PageModel` as a plain dependency. The Theme app must copy this exactly.

**Singleton per-tenant settings** (the "active theme" pointer) have a purpose-built home:
`KeyValueStore` from `@webiny/api-core/features/keyValueStore` — tenant-scoped `get`/`set`/`delete`
returning `Result`. WB uses it for its settings (`pages.gql.ts:170,426`, key
`"WebsiteBuilder/Settings"`). `GlobalKeyValueStore` is the non-tenant-scoped sibling, and
`set` supports `expiresAt` — so it also covers the short-cached tenant→active-theme lookup.

### 1.3 GraphQL

Schema contribution is DI-native, not plugin-based
(`packages/api-website-builder/src/graphql/createGraphQL.ts`):

- Implement `CoreGraphQLSchemaFactory.Interface` with `execute(builder)`
- `builder.addTypeDefs(typeDefs)` and `builder.addResolver({ path, dependencies, resolver })`
- Each resolver **declares its use-case dependencies** and receives them curried — no
  service-locating from `context`
- A namespace root is declared once (`extend type Query { websiteBuilder: WbQuery }`) with a
  resolver returning `{}`

Resolvers stay thin (`graphql/pages/pages.gql.ts`): `ensureAuthentication(context)`, call
`useCase.execute(...)`, map `Result` to the `{ data, error }` envelope via `~/utils/resolve.ts`.
**Authorization is never in the resolver** — it lives in the use case.

**Tenant context** comes from `TenantContext` (`@webiny/api-core/features/tenancy/TenantContext`),
resolved from the container (`WebsiteBuilderFeature.ts:157`). Identity from `IdentityContext`
(`@webiny/api-core/features/security/IdentityContext`).

### 1.4 Security

Per `skills/user-skills/api/permissions/SKILL.md` and
`packages/api-website-builder/src/domain/permissionsSchema.ts`:

```ts
export const WB_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "wb",
    fullAccess: true,
    entities: [{ id: "page", permission: "wb.page", scopes: ["full","own"],
                 actions: [{ name: "rwd" }, { name: "pw" }] }, …]
});
```

Three files, mechanical:

1. `src/domain/permissionsSchema.ts` — `createPermissionSchema` (from
   `@webiny/api-core/exports/api/security.js`)
2. `src/features/permissions/abstractions.ts` — `createPermissionsAbstraction(SCHEMA)`
3. `src/features/permissions/feature.ts` — `createPermissionsFeature(SCHEMA, Abstraction)`

Then `ThemePermissions` is injected into use cases and you call `canRead("theme")`,
`canEdit`, `canDelete(entity, item)`, `canPublish("theme")`. The **same schema object** is used on
the Admin side and passed to `<Security.Permissions schema={…} />`, which renders the whole
permission UI (`app-website-builder/src/Extension.tsx:76-82`). Admin-side gating uses
`<HasPermission entity="…">`.

**For the Theme app:** one entity, `actions: [{ name: "rwd" }, { name: "pw" }]`, `scopes: ["full"]`
(no `own` — themes are tenant-level, not per-author). `p` covers publish, and activation is gated
on the same `pw` action. This satisfies "one permission covering the whole Theme app".

### 1.5 Background tasks

**Definition** — `TaskDefinition` from `@webiny/api-core/features/task/TaskDefinition`
(`abstractions.ts:104`): a class with `id`, `title`, `maxIterations`, `isPrivate`, `databaseLogs`,
`selfCleanup`, an async `run({ input, controller })`, and lifecycle hooks
(`onBeforeTrigger`/`onDone`/`onError`/`onAbort`/`onMaxIterations`), plus optional Zod input
validation. Registered with `TaskDefinition.createImplementation({ implementation, dependencies })`
— tasks get full DI.

**Triggering and parent/child** — `TaskService.trigger({ definition, input, parent?, delay? })`
(`TaskService/abstractions.ts:67`). Inside a running task, the controller exposes
(`packages/background-tasks/src/api/features/TaskController/augmentation.ts`):

```ts
controller.task.trigger({ definition, input })   // child task
controller.task.listChildren(definitionId?)      // poll children
controller.state.updateInput/updateOutput(...)   // persisted state
controller.logger.info/error(...)
controller.runtime.isCloseToTimeout(s) / isAborted() / getRemainingSeconds()
controller.response.done() / error() / continue() / aborted()
```

So parent→child spawning is real and supported.

**Progress over websocket is _not_ built-in.** There is no task-progress channel. What exists is
`WebsocketsSendToIdentityUseCase` (`@webiny/api-websockets/features/SendToIdentity`), a
fire-and-forget push to a user. AI Power-Ups hand-rolls the pattern:

- API: `packages/ai-powerups/src/api/features/CmsGenerateEntryContent/CmsGenerateEntryContentTask.ts:75`
  — `sendToIdentity.execute({ id }, { action: "aiPowerUps.generateEntryContent.content", data })`
- Admin: `useWebsockets().onMessage<T>(ACTION, cb)` from `@webiny/app-websockets`
  (`ai-powerups/src/admin/presentation/CmsContentGeneration/CmsGenerateContentDialog.tsx:53,76`)

Payloads are gzip+base64 compressed for anything sizeable
(`@webiny/utils/features/compression/legacy/gzip.js`).

**Runtime limits — and this is load-bearing.**
`packages/project-aws/src/pulumi/apps/api/ApiBackgroundTask.ts:32-33`:

- **timeout 900s, memory 1024 MB** — one shared Lambda for _all_ background tasks
- driven by a Step Function (`backgroundTask/definition.ts`) fed from EventBridge
  (`detail-type: WebinyBackgroundTask`)
- **there is no per-task memory or timeout configuration.** The only per-task lever is
  `maxIterations` plus `controller.runtime.isCloseToTimeout()` to chunk work across invocations.

Every API Lambda clones the GraphQL Lambda's config and therefore **shares one bundle**
(`baseConfig = graphql.functions.graphql.config.clone()`), and that bundle is capped at **4.5 MB**
by default (`skills/user-skills/api-bundle-size-limit/SKILL.md`). Memory can be varied per Lambda —
`fm-download` runs at 1600 MB (`ApiFileManager.ts:25`) — but bundle contents cannot.

### 1.6 Website Builder theme today

The current theme is a **frontend-owned code object**, not API data. Nothing on the API side knows
it exists — which is exactly why §9's "don't break it" is achievable.

`packages/website-builder-sdk/src/types/WebsiteBuilderTheme.ts:10`:

```ts
type WebsiteBuilderTheme = {
  css?: string; // raw CSS string injected into the editor
  fonts?: string[]; // font URLs loaded by the editor
  breakpoints: Breakpoint[];
  colors: ColorStyle[]; // { id, label, value }
  fontSizes?: string[];
  typography: Record<string, TypographyStyle[]>; // { id, label, tag, className }
};
```

- Authored in the customer's frontend with `createTheme()`
  (`packages/website-builder-sdk/src/createTheme.ts` — an identity function, purely for typing)
- Passed into `contentSdk.init({ apiHost, apiKey, apiTenant, theme })`
  (`ContentSdk.ts:73-115`), merged with `defaultBreakpoints` by `Theme.from()` (`Theme.ts:10`)
- Reaches the Admin editor over the iframe `Messenger` — `EditingSdk` is constructed with the
  theme when `environment.isEditing()`
- Consumed by elements through `ResolvedComponent.styles` and by Lexical through
  `EditorTheme` (`@webiny/lexical-theme`)

**`global.css` is a different thing.** `public/global.css` is the **Admin app's** global stylesheet,
copied in at build time (`packages/project-aws/src/extensions/ProjectAws/BuildAppWorkspace.ts:88`,
`packages/project-server/src/services/ServerBuildAppWorkspaceService.ts:60`). It is not part of the
WB theme mechanism. The WB-side stylesheet is
`packages/website-builder-nextjs/src/lexical.css` (plus Nuxt/Vue twins).

**On the `--wb-` prefix.** Confirmed in use in two unrelated places:
`--wb-theme-color1` / `--wb-theme-font-family` in the starter-kit CSS
(`packages/website-builder-nextjs/src/lexical.css:59`,
`app-website-builder/src/inputRenderers/LexicalInput/LexicalEditor.tsx:24`), and
`--wb-spacing-toolbar` / `--wb-spacing-sidebar` for editor chrome
(`packages/admin-ui/src/theme.css:235-236`). Admin UI's own design tokens are **unprefixed**
(`--color-neutral-base`, `--border-color-accent-default`, `--padding-xs-plus`, …). So `--wby-`
avoids a real collision. The brief's reasoning holds.

### 1.7 Website Builder element styling — exact storage shape

`packages/website-builder-sdk/src/types.ts:23-59`:

```ts
type ValueBinding<T> = { static?: T; expression?: string };
type DocumentElementStyleBindings = Partial<{ [K in keyof CssProperties]: ValueBinding<CssProperties[K]> }>;

type DocumentElementBindings = {
    $repeat?: RepeatValueBinding;
    inputs?:  DocumentElementInputBindings;
    styles?:  DocumentElementStyleBindings;
    metadata?: Record<string, any>;
    overrides?: { [breakpoint: string]: { inputs?: …; styles?: DocumentElementStyleBindings } };
};

type DocumentBindings = { [elementId: string]: DocumentElementBindings };
```

Stored in the page entry's `bindings` JSON field. A token reference is naturally a **third member
of `ValueBinding`** — e.g. `{ token: { type: "color", path: "action.primary.background" } }` —
sitting alongside `static` and `expression`, which satisfies §7.1's "references and literals in the
same field indefinitely" without a data migration.

Code that must learn about the new member:

- `packages/website-builder-sdk/src/StylesBindingsProcessor.ts:37-44` — `toDeepStyles()` does
  `result[key] = styles[key].static`, i.e. it hard-assumes `static`
- `StylesBindingsProcessor.createUpdate()` (`:78-90`) — writes `set(rebuilt, 'styles.${key}.static', value)`
- `packages/website-builder-sdk/src/InheritedValueResolver.ts` — breakpoint inheritance comparison
- Editor UI: `BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles.ts` + `StylesStore.ts`, and
  every control, e.g. `…/Groups/Background/BackgroundColor.tsx` which calls
  `styles.set("backgroundColor", value)` with a plain string

### 1.8 Colour picker

**Current implementation.** `packages/admin-ui/src/ColorPicker/` — `ColorPicker.tsx` wraps
`ColorPickerPrimitive.tsx`, which renders **`SketchPicker` from `react-color`**
(`ColorPickerPrimitive.tsx:2`) inside a Radix `Popover`. MobX presenter in
`primitives/presenters/ColorPickerPresenter.ts`. Stories + `.mdx` + a presenter unit test exist.

**Call sites** (all `import { ColorPicker } from "@webiny/admin-ui"`):

1. `packages/app-website-builder/src/BaseEditor/defaultConfig/Sidebar/StyleSettings/Groups/Background/BackgroundColor.tsx`
2. `packages/app-website-builder/src/BaseEditor/defaultConfig/Sidebar/StyleSettings/Groups/Border/BorderColor.tsx`
3. `packages/app-admin/src/components/IconPicker/plugins/iconsPlugin.tsx`
4. `packages/app-workflows/src/presentation/workflowsEditor/components/Editor/Step/Form/StepFormColor.tsx`

Plus two more surfaces that are _not_ this component:

5. **Lexical** has its own: `packages/lexical-editor-actions/src/components/LexicalColorPicker/LexicalColorPicker.tsx`
   - `LexicalColorPickerDropdown.tsx`, driven by `useFontColorPicker()` and the
     `FontColorAction.ColorPicker` composition slot
     (`packages/lexical-editor/src/components/ToolbarActions/FontColorAction.tsx`)
6. **A gap:** `createColorInput()` in `packages/website-builder-sdk/src/createInput.ts:126` declares
   `renderer: "Webiny/ColorPicker"`, but **no such renderer is registered** in
   `packages/app-website-builder/src/BaseEditor/defaultConfig/ElementInputRenderers.tsx`. Component
   authors can declare a colour input today and get nothing. The new picker should close this.

`react-color` is unmaintained (last release 2022) and is a direct dependency of `@webiny/admin-ui`.
Replacing it is a bonus of this work, not a cost.

### 1.9 Lexical

**Version: `^0.48.0`** across `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/code`,
`@lexical/selection`, `@lexical/utils`, `@lexical/history`, `@lexical/text`
(`packages/lexical-editor/package.json`).

**The class-name map is in active use.** `packages/lexical-theme/src/createLexicalEditorTokens.ts`
builds a full `EditorThemeClasses` from a prefix (`WebinyLexical__…`) covering `paragraph`,
`heading.h1-h6`, `quote`, `code`, `codeHighlight.*`, `list.*`, `text.*`, `link`, `table*`,
`fontColorText`. `createTheme()` (`lexical-theme/src/createTheme.ts`) bundles those class names with
the WB theme's `colors`, `typography` and `fontSizes` into an `EditorTheme`.

**Per-selection colour already stores a reference.** This is the most useful finding for §7.3.
`packages/lexical-nodes/src/FontColorNode.ts`:

```ts
class ThemeColorValue {
    private readonly id: string;   // theme colour id, or "custom"
    private value: string;         // hex or CSS variable
    updateFromTheme(theme: Theme) { /* re-resolves value from theme.colors by id */ }
}

exportJSON(): { …SerializedTextNode, themeColor: string, color: string, type: "wby-font-color" }
createDOM/updateDOM(): element.setAttribute("data-theme-font-color-name", id);
                       element.style.color = value;
```

So today a coloured span serialises as **reference + cached literal**, renders as inline
`style="color: …"` plus a `data-` attribute carrying the reference, and re-resolves from the editor
theme on every render. That is already 80% of the mechanism the brief asks for.

**Structural styling** (paragraph/heading/quote/code/list) is class-name based, exactly as §7.3
proposes. `packages/app-admin/src/config/AdminConfig/LexicalTheme/{Color,Typography}.tsx` is where
Admin registers the colours and typography offered in the rich-text toolbar — that's the
integration point for the Theme app's policy-constrained lists.

**Newer Lexical APIs.** I did **not** verify against Lexical's upstream changelog — that needs
network access and a spike. What I can say from the code: 0.48's `EditorThemeClasses` is still the
sanctioned way to bind node types to CSS, and nothing in the 0.48 typings offers a token/variable
abstraction. Recommend a half-day spike before Phase 4 rather than treating this as settled.

**Serialisation to HTML.** `packages/lexical-converter/src/` (`createHtmlToLexicalParser.ts`,
`createLexicalStateTransformer.ts`, `postProcessHtml.ts`) and
`packages/react-rich-text-lexical-renderer/src/index.tsx`.

### 1.10 Frontend SDK and rendering

**Tenant resolution is a static config value, not a host map.** `ContentSDKConfig` takes
`apiTenant: string` and `ApiClient` sends it as a header on every request:

```ts
// packages/website-builder-sdk/src/dataProviders/ApiClient.ts:26-35
fetch(`${this.config.apiHost}${path}`, {
    headers: { "X-Tenant": this.config.apiTenant, Authorization: "Bearer " + this.config.apiKey, … }
})
```

There is **no query-param tenant override and no host-header→tenant map** anywhere in the frontend
packages. On the API side `x-tenant` is the recognised header
(`packages/api-websockets/src/handler/types.ts:64` and every test harness).

**Head injection** — there is no mechanism today. `@webiny/website-builder-nextjs` ships only
`DocumentRenderer.tsx`, `lexical.css`, `webpack.ts` and an `Image` component. The customer owns
`layout.tsx`. Anything the Theme app needs in `<head>` must be a new export the customer mounts.

**A unified frontend SDK is in flight, not on `next`.** `@webiny/sdk-frontend` exists only on
`origin/pavel/feat/frontend-sdk-65` (last commit 2026-07-28): `FrontendSdk.ts` composing
`sdk.cms`, `sdk.wb`, `sdk.languages`, `sdk.fileManager`, `sdk.tenantManager`, `sdk.tasks`,
`sdk.webhooks` over `@webiny/sdk`. `packages/sdk-frontend`, `sdk-nextjs`, `cms-sdk`,
`content-sdk-nextjs` all show as `dist`-only on `next`. **The Theme SDK surface should be
`sdk.theme` on that object**, which makes Phase 5 dependent on that branch landing.

**Preview** already has real machinery to reuse: `PreviewSdk`, `PreviewDocument`, `PreviewViewport`,
`messenger/Messenger.ts` in `website-builder-sdk`, plus the `PreviewUrlModifier` DI extension point
(`skills/user-skills/admin/website-builder/wb-preview-url-modifier/SKILL.md`) that injects query
params into every preview URL. §6.5's "SDK accepts a theme and version override from query params"
maps onto `PreviewUrlModifier` almost exactly.

### 1.11 ISR and webhooks

**Revalidation today is time-based only.** `ApiClient.query()` sets
`next: { revalidate: this.config.preview ? 0 : 60 }`
(`packages/website-builder-sdk/src/dataProviders/ApiClient.ts:39-43`). No cache tags, no
`revalidateTag`, no revalidation route ships in any Webiny package.

**The webhook _sender_ is complete and generic.** `@webiny/webhooks` has the full CRUD + deliveries

- retry + settings + Admin UI (`packages/webhooks/src/{api,admin}`). Registering events is two
  pieces:

1. A `WebhookFactory` implementation listing `{ app, appLabel, entity, entityLabel, eventName, label }`
   — `packages/api-website-builder/src/features/webhooks/WbWebhookEventProvider.ts`
2. Thin event handlers that call `WebhookDispatcher.dispatch(eventName, payload)` —
   `features/webhooks/handlers/OnPagePublishedHandler.ts` (11 lines)

So `theme.published` / `theme.activated` are cheap. The **receiver** (the SDK-shipped revalidation
handler) is greenfield.

**Serving artifacts.** Core HTTP routes implement `HttpRoute.Interface` from
`@webiny/event-handler-core` with `method`/`path` fields
(`packages/api-website-builder/src/rest/WebsiteBuilderRedirectsRoute.ts`) — note it already sets
`cache-control: public, max-age=31536000`. The API Gateway route must **also** be declared in
Pulumi: `packages/project-aws/src/pulumi/apps/api/createApiPulumiApp.ts:239-250` (`/wb/redirects`
GET + OPTIONS). The API is fronted by CloudFront (`ApiCloudfront`), so immutable long-TTL artifact
URLs behind a Next.js rewrite will behave as §6.3 wants.

### 1.12 Tailwind

`tailwindcss ^4.3.3` in `@webiny/admin-ui`, using the CSS-first config:
`packages/admin-ui/src/theme.css` is `@import "tailwindcss"` + a large `@theme { … }` block +
`@layer base`. That's the exact mechanism §6.6 targets, and admin-ui is a working reference for it.
`@theme static` is not currently used anywhere, so the "Tailwind drops unreferenced custom
properties" problem is unexercised in-repo and needs the spike the brief calls for.

The **customer-facing starter kit is not in this repo** — I found no Tailwind config for it here, so
its Tailwind version is unconfirmed from the codebase. `@webiny/website-builder-nextjs` declares
`peerDependencies: { next: ">=15" }` and ships `postcss` + `postcss-import`.

### 1.13 Component library module

> **RESOLVED 2026-08-01 — deferred.** The component library lands later; the Theme app does not
> need to fit its contract in v1. Findings below retained for whenever it arrives.

**I could not find it.** No `componentLibrary` / `component-library` identifier anywhere in
`packages/`, `ai-context/` or `docs/`; no branch among 402 matching `component`; no PRD in
`ai-context/prds/`. Either it lives outside this repo, is unpushed, or is named something I didn't
guess.

What does exist, and is probably what the preview contract has to fit:

- `createComponent(component, manifest)` (`packages/website-builder-react/src/createComponent.ts`)
  returning `{ component, manifest }`
- `ComponentManifest` (`website-builder-sdk/src/types.ts:246`+) — `name`, `group`, `label`, `image`,
  `inputs[]`, `tags[]`, `constraints`, `defaults.{inputs,styles,overrides}`, `hideStyleSettings`,
  `aiContext`, `useInAiContentGeneration`
- `ComponentRegistry` + `registerComponentGroup` in the SDK; components register in the customer's
  frontend and the editor discovers them across the iframe boundary via `Messenger`
- The "preview mechanism" is the live editing iframe itself (`EditingSdk`, `PreviewSdk`,
  `PreviewViewport`, `ViewportManager`)

That's a genuinely good fit for a Theme-app preview region later: same iframe, same messenger,
different document.

---

## 2. Proposed package structure

Five packages. Naming follows the product name; see the conflict note in §3.1.

```
packages/
├── theme-common/          @webiny/theme-common
│   └── src/
│       ├── dtcg/          W3C DTCG types, $extensions "com.webiny.modes" namespace, Zod schemas
│       ├── canonical/     the 29 colour slots, 11 type roles, 4 ramps — one source of truth
│       ├── naming/        path → --wby-* derivation, immutable key generation
│       ├── resolve/       alias graph walk, cycle detection, depth cap, type compatibility
│       ├── fluid/         clamp() generator + the two enforced constraints
│       ├── a11y/          contrast pairs, zoom-ratio check
│       ├── artifacts/     ThemeDocument → tokens.json / tokens.css projections
│       └── policy/        policy schema + defaults
│
├── api-theme/             @webiny/api-theme
│   └── src/
│       ├── domain/        theme.model.ts (private CMS model), permissionsSchema.ts, errors.ts,
│       │                  EntryToThemeMapper.ts, abstractions.ts
│       ├── features/      CreateTheme, GetThemeById, ListThemes, UpdateTheme, DeleteTheme,
│       │                  CreateThemeRevisionFrom, PublishTheme, ActivateTheme, GetActiveTheme,
│       │                  GenerateArtifacts, permissions/, webhooks/
│       ├── graphql/       theme.gql.ts + theme.typeDefs.ts + createGraphQL.ts
│       ├── rest/          ThemeArtifactRoute.ts  (/_webiny/theme/{themeId}/{version}/{file})
│       └── ThemeFeature.ts
│
├── app-theme/             @webiny/app-theme
│   └── src/
│       ├── features/      headless: gateways/repositories/use cases per operation
│       ├── presentation/  ThemeList, ThemeEditor (per-group editors), Policy, VersionHistory,
│       │                  ExtractionProgress, security/
│       ├── routes.ts
│       └── Extension.tsx
│
├── theme-tailwind/        @webiny/theme-tailwind   — reference @theme adapter (Phase 5)
└── api-theme-extraction/  @webiny/api-theme-extraction — BrowserProvider + crawl + model call
                                                          (Phase 6, separate for bundle reasons)
```

Plus edits to existing packages:

| Package                                                                      | Change                                |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| `packages/api-event-handler-core/src/registerApiRequestStack.ts`             | `ThemeFeature.register(container)`    |
| `packages/app-serverless-cms/src/Admin.tsx`                                  | `<Theme />`                           |
| `packages/webiny/src/api/theme/*.ts`, `packages/webiny/src/admin/theme/*.ts` | public abstraction re-exports         |
| `packages/project-aws/src/pulumi/apps/api/createApiPulumiApp.ts`             | artifact route(s)                     |
| `packages/admin-ui/src/ColorPicker/`                                         | replacement picker (shared component) |
| `packages/website-builder-sdk/src/types.ts` + `StylesBindingsProcessor.ts`   | token binding variant                 |
| `@webiny/sdk-frontend` (in-flight branch)                                    | `sdk.theme`                           |

**Why hardwired core over first-party extension.** The colour picker, Lexical toolbar and WB style
sidebar must consult theme policy on _every_ project, including ones with no active theme (§9's
"no active theme is a permanently supported state" is a behaviour those surfaces have to implement,
not an absence). A first-party extension the user could remove would leave those consumers with a
dangling dependency. AI Power-Ups can be an extension because nothing else consumes it.

**Why `theme-common` is a separate package and not `api-theme/shared`.** The alias resolver,
canonical slot registry and variable-name derivation are needed by the API (publish), Admin
(validation + swatches), the frontend SDK (typing the payload) and the Tailwind adapter. Precedents:
`@webiny/shared-aco`, `@webiny/app-headless-cms-common`, `@webiny/website-builder-sdk`.

---

## 3. Conflicts between the brief and the codebase

### 3.1 Naming collision on "theme" (low severity, decide now)

`@webiny/lexical-theme`, `WebsiteBuilderTheme`, `Theme.from()`, `AdminConfig.Theme`,
`AdminConfig.LexicalTheme` and `admin-ui/src/theme.css` all exist. Package names don't collide, but
`import { Theme }` will be ambiguous constantly.

**Recommendation:** keep the `theme` package names (the product is called Theme), and name internal
types unambiguously — `ThemeDocument`, `DesignTokens`, `CanonicalSlot`, `TokenReference` — never a
bare `Theme`. Alternative if you'd rather be safe: `api-design-tokens` / `app-design-tokens`.

### 3.2 §6.3 — the tenant-resolution mechanism the brief assumes doesn't exist

> **RESOLVED 2026-08-01 — descoped.** Theme resolution follows the app's configured tenant, like
> every other Webiny content type. Multi-tenant-per-app is a separate project across the whole
> frontend SDK and is out of scope here. Findings below retained as the rationale.
>
> Consequence for the build: the SDK resolves the active theme for the single configured
> `apiTenant`, and §6.3's "short-cached, invalidated on activation" lookup is a plain per-tenant
> `KeyValueStore` read. No host map, no `?__tenant=` override. §1's "one Next.js app serving many
> tenants" is not a v1 claim.

> "Tenant to active theme resolution reuses the existing mechanisms: tenant ID by query param on
> development, host header map on production."

There is no such existing mechanism. The frontend is configured with a single static `apiTenant`
string passed to `contentSdk.init()` and sent as `X-Tenant`
(`packages/website-builder-sdk/src/dataProviders/ApiClient.ts:30`). No query-param override, no host
map, in any frontend package.

Consequently §1's headline — "one Next.js app serving many tenants can render each with its own
theme" — is **not currently possible for any Webiny content**, theme or otherwise. Pages, redirects
and CMS entries all resolve through the same single-tenant client.

Options considered: descope (chosen); build host→tenant mapping in the frontend SDK as part of this
project; or a theme-only tenant override, which would have created exactly the kind of parallel
mechanism the brief tells us to avoid.

### 3.3 §10.2 — Chromium in the background-task Lambda (high severity)

Three separate constraints collide:

- **One shared background-task Lambda**, 900s / **1024 MB**, no per-task override
  (`ApiBackgroundTask.ts:32-33`). Headless Chromium wants ~1600–2048 MB.
- **One shared bundle** for every API Lambda, capped at **4.5 MB**
  (`skills/user-skills/api-bundle-size-limit/SKILL.md`). `playwright-core` alone blows this.
- **`@sparticuz/chromium-min` fetches the browser pack at runtime, but the driver library still has
  to be in the bundle.**

Also: **`@webiny/aws-layers` already publishes a `chromium` layer** —
`getLayerArn("chromium")` is available today (`packages/aws-layers/layers.js`, alongside `sharp`,
`webiny-v4-sharp`, `shelf-io-chrome-aws-lambda-layer`). It is currently unused on `next`, presumably
left from v5 prerendering. Its Chromium version and region coverage need verifying, but it likely
removes the need for §10.2's "host the Chromium pack in the project's own S3 bucket".

**Recommendation:** a dedicated `ApiThemeExtraction` Pulumi module — its own Lambda at 2048 MB with
the `chromium` layer attached, following the `fm-download` precedent (`ApiFileManager.ts:22-40`).
Keep the crawl in `@webiny/api-theme-extraction` so it doesn't inflate the shared bundle. The
`BrowserProvider` abstraction the brief asks for is the right seam for this, and for the Webiny
Cloud hosted-rendering variant.

### 3.4 §10.2 — "child tasks report progress over websocket" is not existing machinery

The websocket transport exists; a task-progress channel does not. `WebsocketsSendToIdentityUseCase`
is a one-way push to an identity. AI Power-Ups implements the pattern by hand in ~30 lines on each
side. We'd do the same. Small, but it's build-not-reuse, and worth generalising into
`@webiny/background-tasks` if a second consumer justifies it.

### 3.5 §3 — "how `global.css` fits in"

`public/global.css` is the **Admin app's** global stylesheet, injected at build time
(`BuildAppWorkspace.ts:88`). It has nothing to do with the WB theme. The WB frontend stylesheet is
`packages/website-builder-nextjs/src/lexical.css`. I've assumed the question meant the latter.

### 3.6 §7.3 — the Lexical open decision is already answered by shipped code

`FontColorNode` already does exactly the brief's preferred option: store a reference
(`themeColor` id) **plus** a resolved literal (`color`), re-resolve from the theme at render, and
export HTML as `style="color: <literal>" data-theme-font-color-name="<id>"`
(`packages/lexical-nodes/src/FontColorNode.ts:121-146`).

**Recommendation:** adopt this as the answer rather than re-litigating it. Generalise
`ThemeColorValue` into a `TokenReference` that covers colour _and_ size, rename the attribute to
`data-wby-token`, and keep resolved literals in HTML export. Rationale: it works for arbitrary API
consumers with no stylesheet, the reference survives round-tripping through storage, a themed
consumer can re-bind from the attribute if it wants, and it's a smaller change than any alternative.
Accept that exported HTML snapshots stop following theme changes — that's correct for an export.

One wrinkle for §4.8's "no consumer resolves anything at runtime": the Lexical editor _does_
resolve at runtime today (`updateFromTheme`). That's the editor, not published output, so the
invariant holds where it matters — but the sentence needs the caveat.

### 3.7 §7.2 — the picker replacement is wider than "the existing picker"

There are two independent colour pickers (`admin-ui/ColorPicker` and
`lexical-editor-actions/LexicalColorPicker`) plus one declared-but-missing renderer
(`Webiny/ColorPicker`, §1.8 item 6). "Replacing the picker" means unifying three things. Larger than
the brief implies, but the right outcome.

### 3.8 §3 — the component library module

Not found (§1.13). **Deferred by decision** — it arrives later and the Theme app is not required to
fit its contract in v1. The preview region still ships as the designed-but-unwired placeholder.

### 3.9 §6.7 / Phase 5 — the SDK we'd extend is on an unmerged branch

`@webiny/sdk-frontend` lives on `origin/pavel/feat/frontend-sdk-65`. Phase 5 should not start until
it lands, or we'll build against a moving target.

---

## 4. Risks

| #       | Risk                                                                | Impact                                                                     | Mitigation                                                                                                                                                       |
| ------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~R1~~  | ~~Multi-tenant frontend doesn't exist (§3.2)~~                      | —                                                                          | **Closed** — descoped 2026-08-01. Theme follows the app's configured tenant.                                                                                     |
| R2      | Chromium/Playwright vs 4.5 MB bundle + 1024 MB shared Lambda (§3.3) | Phase 6 blocked                                                            | Dedicated Lambda + `chromium` layer; spike early, don't leave it to Phase 6.                                                                                     |
| R3      | Theme document size vs DynamoDB 400 KB item limit                   | Publish fails on large themes                                              | Store artifacts in S3 (file-manager), not in the entry. `CompressionFeature` is already in the WB stack. Measure with a realistic enterprise palette in Phase 1. |
| R4      | Replacing a shared `admin-ui` component                             | Visual regressions in 4 unrelated call sites + Storybook + presenter tests | Keep the existing API surface as a compatibility layer; add token mode additively.                                                                               |
| R5      | `StylesBindingsProcessor` hard-assumes `.static` (§1.7)             | Silent value loss if references leak into breakpoint inheritance           | Type the binding union so TS forces every branch; add inheritance tests with mixed reference/literal.                                                            |
| R6      | Preview region shipped as a placeholder                             | Contract designed against nothing                                          | §6.5 hooks + reuse the existing iframe `Messenger`/`PreviewSdk`, which is a known-good shape.                                                                    |
| R7      | `sdk-frontend` unmerged (§3.9)                                      | Phase 5 rework                                                             | Sequence Phase 5 after that branch merges.                                                                                                                       |
| R8      | 2.5× zoom ratio, 5-page crawl, 40-colour cap all unvalidated        | Wrong thresholds shipped                                                   | Brief already flags these; verify in Phases 3 and 6 and report.                                                                                                  |
| R9      | Task progress channel is hand-rolled per consumer (§3.4)            | Duplication                                                                | Build ours cleanly; propose promoting it into `@webiny/background-tasks` afterwards.                                                                             |
| ~~R10~~ | ~~No component-library module found (§1.13)~~                       | —                                                                          | **Closed** — deferred 2026-08-01, out of scope for v1.                                                                                                           |

---

## 5. Proposed Phase 1 breakdown

Phase 1 = token schema, storage, CRUD, versioning, publish, activate, alias resolution, validation,
security permission. No UI. I'd add the pure-function checks here too — they're cheap, they're
independently testable, and Phase 3 then only renders them.

**Decisions needed before starting:** package naming (§3.1) and hardwired-core vs
first-party-extension (§2). Neither blocks 1.1–1.5, which are pure functions in `theme-common`.

**Closed:** multi-tenant frontend (§3.2, descoped) and the component library contract
(§1.13/§3.8, deferred).

| #    | Deliverable                                                                                                                                                                                                                                       | Notes                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1.1  | `@webiny/theme-common`: DTCG types + Zod schema, `com.webiny.modes` `$extensions` namespace, canonical slot registry (29 colour slots, 11 type roles, spacing/type-size ×9, radius ×5, shadow ×5), immutable-key generation, `--wby-*` derivation | Pure, no deps. Unit tests.                                        |
| 1.2  | Default theme seed — every canonical slot filled                                                                                                                                                                                                  | Feeds "a theme is never partially filled".                        |
| 1.3  | Alias resolver: graph walk, cycle detection with path reporting, depth cap 3, type compatibility                                                                                                                                                  | Unit tests incl. cycles + depth, per §14.                         |
| 1.4  | Fluid value generator: base+ratio ramp, per-step override, `clamp()` with mandatory `rem` term in the middle, mandatory plain fallback declaration                                                                                                | Both constraints enforced in code + tested, per §4.5.             |
| 1.5  | Accessibility checks: contrast for schema-known fg/bg pairs (light + dark), zoom ratio (max ≤ 2.5 × min)                                                                                                                                          | Pure functions, tested. Brief's §11.                              |
| 1.6  | `@webiny/api-theme` skeleton: private CMS model `wbyTheme` (json fields: `tokens`, `policy`, `metadata`, `properties`, `extensions`), `ThemeModel` abstraction + per-request `RequestContextInitializer`                                          | Mirror `page.model.ts` + `WebsiteBuilderFeature.ts:127-143`.      |
| 1.7  | Permission schema + abstraction + feature (`prefix: "theme"`, one entity, `rwd` + `pw`, `scopes: ["full"]`)                                                                                                                                       | Three files, per §1.4.                                            |
| 1.8  | CRUD features: Create / GetById / List / Update / Delete / CreateRevisionFrom — abstractions, repositories over CMS use cases, use cases with permission checks, domain errors, before/after events                                               | One feature dir each, per `api-architect`.                        |
| 1.9  | Validation gate: all canonical slots resolve, no cycles, type compatibility, referenced-primitive hard block on delete (§8)                                                                                                                       | Reuses 1.1/1.3.                                                   |
| 1.10 | `PublishTheme`: validate → resolve aliases → freeze resolved snapshot onto the revision → `PublishEntryUseCase` → events                                                                                                                          | Mirror `PublishPageUseCase.ts`.                                   |
| 1.11 | `ActivateTheme` / `GetActiveTheme`: tenant-scoped `KeyValueStore` pointer + events; rollback = activate an older published version                                                                                                                | `@webiny/api-core/features/keyValueStore`.                        |
| 1.12 | GraphQL: `theme: ThemeQuery` / `ThemeMutation` namespace, typeDefs + DI resolvers                                                                                                                                                                 | Mirror `createGraphQL.ts` + `pages.gql.ts`.                       |
| 1.13 | Wire-up: `registerApiRequestStack.ts`, public re-exports under `packages/webiny/src/api/theme/`                                                                                                                                                   | One line + export files.                                          |
| 1.14 | Integration tests: publish → activate → rollback; permission matrix                                                                                                                                                                               | Pattern: `packages/api-website-builder/__tests__/pages*.test.ts`. |

**Explicitly not in Phase 1:** artifact generation and the delivery route (Phase 2 — but 1.10 should
already store the resolved snapshot the artifacts are projected from, so Phase 2 is a pure
projection), webhooks (Phase 2), any UI.

**Suggested tracer bullet for 1.6–1.14:** get `createTheme → updateTheme → publishTheme →
activateTheme → getActiveTheme` working end-to-end over GraphQL with a single colour slot before
filling in the full canonical set. That exercises the model registration, per-request resolution,
permissions, revisions, publish and the KV pointer in one pass — which is where the integration
surprises live.
