# Investigation: activity log AI summaries

Read-only investigation, run against the `feat/entry-activity-log` worktree with `origin/next`
merged in at `796cd01301`. Every platform file cited is at `next` state; only the
`api-activity-log` / `app-activity-log` packages carry PR #5682 work on top.

The Webiny MCP server was available and used throughout (`get_started`, the skill catalog, and the
`webiny-ai-powerups-content` skill).

No design proposed, no implementation written.

---

## Contents

1. [Task 1 — Distinguishing UI writes from API writes](#task-1--distinguishing-ui-writes-from-api-writes)
2. [Task 2 — Field-level permissions](#task-2--field-level-permissions)
3. [Task 3 — AI Powerups](#task-3--ai-powerups)
4. [Task 4 — Background task payload storage](#task-4--background-task-payload-storage)
5. [Premises contradicted](#premises-contradicted)

---

## Task 1 — Distinguishing UI writes from API writes

### What the request context actually carries

`packages/api-core/src/features/requestContext/abstractions.ts` defines the **entire** per-request
surface: `RawTenantId` (`:13`) and `RawAuthToken` (`:33`), plus two loaders. That is all the
transport lifts out of the HTTP event.

`packages/api-event-handler-aws/src/handlers/ApiGatewayIdentityLoaderDecorator.ts:28-31` reads
`ctx.event.headers`, extracts **only** the auth token, and sets it.
`packages/api-event-handler-aws/src/composition/registerWebinyApiChild.ts` (all 38 lines) registers
no raw event, request or header bag into the container.

**Headers and user agent are not reachable from a use case or event handler.** They exist only in
middleware `ctx.event`, which is never surfaced. Locale is absent entirely — no `I18NContext`,
`LocaleContext` or `getLocale` exists anywhere in `api-core` or `api-headless-cms` on `next`, and no
locale header is extracted.

Two of the brief's suggested discriminators (headers, user agent) are unavailable, and a third
(locale) does not exist.

### What the admin app sends

Three headers, from two decorators and the fetch client:

| Header                            | Set at                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `Authorization: Bearer <idToken>` | `packages/app-admin/src/features/security/AuthenticationContext/GraphQLClientDecorator.ts:19` |
| `x-tenant`                        | `packages/app-admin/src/features/tenancy/GraphQLClientDecorator.ts:17`                        |
| `Content-Type`                    | `packages/app/src/features/graphqlClient/FetchGraphQLClient.ts:30`                            |

An exhaustive grep for `x-*` headers across `app/src`, `app-admin/src` and `app-headless-cms/src`
returns only `x-tenant`, `x-webiny-authorization` and `x-amz-content-sha256`.
`x-webiny-authorization` is an auth header for CloudFront/OAC origins
(`packages/api-event-handler-aws/src/handlers/extractRequestAuth.ts:32-38`), used by the streaming
client — not a client marker.

**The admin app sets no client identifier, and no GraphQL context marker.**

### Whether identity type separates them

Three identity types exist:

| Type          | Assigned at                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `"api-key"`   | `packages/api-core/src/features/security/apiKeys/ApiKeyAuthenticator.ts:33`, for tokens prefixed `wat_` (`:17`) |
| `"admin"`     | `packages/api-core/src/idp/JwtAuthenticator.ts:41`, the default for **any** JWT the IDP resolves                |
| `"anonymous"` | `packages/api-core/src/features/security/IdentityContext/AnonymousIdentity.ts:12`                               |

`Identity.isAdmin()` is `type === "admin"`
(`packages/api-core/src/features/security/IdentityContext/Identity.ts:84`).

- **Do admin UI writes always carry an admin identity?** Yes, unless an IDP provider overrides
  `type`, which `JwtAuthenticator.ts:41` permits.
- **Can API-key writes originate from the UI?** No. The admin attaches only the id token; nothing
  in the admin issues a `wat_` key.
- **Is a script using a personal user token distinguishable?** **No.** A JWT is a JWT. It travels
  the same `extractAuthToken` path, produces the same `AuthenticatedIdentity` with the same
  `type: "admin"`, and arrives at the same mutation. There is no residue of origin anywhere in the
  container.

### What the existing source labelling captures

`packages/api-activity-log/src/cms/recorder/ActivitySourceResolver.ts:30-50` resolves, in order:
`task:<definitionId>` if a task is running (`:52-64`), `"system"` if anonymous (`:39-43`), otherwise
`identity.type` verbatim (`:49`).

It separates **task-performed writes from direct ones**, and machine tokens from users. It does not,
and cannot, separate UI from script.

`TaskExecutionContext` is a request-scoped singleton whose getters throw until execution starts
(`packages/background-tasks/src/api/features/TaskExecutionContext/TaskExecutionContext.ts:13-18`,
registered at `features/TaskExecutionContext/feature.ts:7`), which is what makes that detection
sound.

### Bulk operations

These **are** distinguishable. CMS bulk actions run as background tasks —
`packages/api-headless-cms-bulk-actions/src/features/EntriesBulkAction/createBulkActionTasks.ts:23-24`
defines `hcmsBulkListEntries` and `hcmsBulkProcessEntries` as `TaskDefinition`s, so they carry a
`task:` source.

### What a reliable rule would look like

**For UI versus script: none exists, and no approximation is proposed.** Both are JWT-authenticated
`type: "admin"` identities; the one dimension that could carry origin (headers) is not plumbed to
where the decision would be made. Any rule would need either a new header set by the admin client
_and_ a new request-context holder to carry it inward, or a marker on the GraphQL operation.

**For the high-volume concern the brief actually raises**, the existing `source` already separates
the expensive cases: bulk operations and scheduled/automated writes are `task:*`, machine
integrations using API keys are `api-key`, infrastructure writes are `system`. What remains
indistinguishable is a human at the admin UI versus a script holding that human's token.

---

## Task 2 — Field-level permissions

**The brief's premise is wrong. Field-level permissions are not enforced anywhere on `next`.**

### The evaluator, unchanged

`packages/app-headless-cms/src/features/formModel/CmsAccessControlRuleEvaluator.ts:13-16`:

```ts
evaluate(_rule: IRule, _form: IFormModel): boolean {
    // TODO: implement actual access control check against current identity/permissions
    return false;
}
```

Still unconditional, still carrying its TODO. Nothing changed. It lives in **`app-headless-cms`** —
the admin bundle — and operates on `IFormModel`. It is a client-side form rule, not an
authorisation check.

### What enforces field permissions on the API

**Nothing.** Named absences:

- `AccessControl` (`packages/api-headless-cms/src/crud/AccessControl/AccessControl.ts:64`) has
  `canAccessGroup` (`:100`), `canAccessModel` (`:204`), `canAccessEntry` (`:412`). **No field method
  exists.**
- Repo-wide grep for `canReadField`, `canWriteField`, `FieldAccess`, `fieldAccess` across
  `api-headless-cms/src` returns nothing.
- `FieldRule` with `type: "accessControl"`
  (`packages/api-headless-cms/src/types/modelField.ts:8-14`) is consumed only by: the builder that
  defines it (`features/modelBuilder/fields/BaseFieldBuilder.ts`), schema validation
  (`domain/contentModel/schemas.ts`), and GraphQL model exposure
  (`graphql/schema/contentModels.ts`). It is stored and served; it is never evaluated for
  authorisation.

### The entitlement

`advancedAccessControlLayer.hcmsFieldPermissions` exists and is licence-governed
(`packages/api-core/src/features/featureFlags/decorators/FeatureFlagsWithLicenseDecorator.ts:35` →
`canUseHcmsFieldPermissions`).

Every consumer is either flag plumbing or **admin UI gating of the editor that authors the rules**:
`PermissionsEditor.tsx:55` and `CmsAccessControlRulesRenderer.tsx:69`. The only API-side reference
is the entitlement accessor itself
(`packages/api-core/src/features/wcp/WcpContext/decorators/WcpContextWithFeatureFlagsDecorator.ts:217-221`).

The entitlement gates whether an editor can _configure_ field permissions. Nothing consumes the
configuration.

### The API for asking

**Absent.** There is no way to ask whether an identity may read a given field on a given model.
Enforcement happens at neither read nor write.

---

## Task 3 — AI Powerups

### The abstraction

Two layers.

**Low level:** `Ai` — `packages/api-core/src/features/ai/abstractions.ts:86-95`, with
`generateText`, `streamText`, `listModels`. Params take `model: string` fully qualified as
`"<providerId>/<modelId>"` and an optional `connection` (`:70-73`).

**High level:** `ResolveAiCapabilityUseCase` —
`packages/ai-powerups/src/api/features/Capabilities/ResolveAiCapabilityUseCase.ts:37`. Turns a
capability id into `{ model, connection: { sdkName, apiKey }, guidance, additionalInstructions,
roleId, fellBackToStandard }`.

### Usable from a background task

**Yes, with a working example.**
`packages/ai-powerups/src/api/features/AiImageEnrichment/AiImageEnrichmentTask.ts:21-26` injects
`Ai` straight into a `TaskHandler` and calls `this.ai.generateText(request)` at `:54`. Nothing about
`Ai` is request-bound.

A second example uses the capability layer instead:
`packages/ai-powerups/src/api/features/CmsGenerateEntryContent/CmsGenerateEntryContentTask.ts`.

### Unconfigured behaviour

**Two different failure modes, depending on the layer.**

`Ai` **throws**:

- unknown connection id — `packages/api-core/src/features/ai/Ai.ts:154`
- no connection for provider — `Ai.ts:164`
- malformed model id — `Ai.ts:118`

`ResolveAiCapabilityUseCase` **returns `Result.fail`**, never throws:

- unregistered capability id — `:42`
- settings unreadable — `:51`
- connection missing — `:68`
- connection has no API key — `:76`
- model/connection vendor mismatch — `:90`
- no model configured for the role — `:169`

The capability layer is the checkable "is a connection configured" surface.

### Entitlement gating

The extension registers **unconditionally**
(`packages/ai-powerups/src/api/Extension.ts:40-57`), with an explicit comment at `:51-53` that a
register-time `canUse*` check reads `NullLicense` and is always false. Gating is per-feature at
trigger time: image enrichment checks `aiPowerups.fileManager.imageEnrichment`
(`features/AiImageEnrichment/feature.ts:20`).

**`CmsCompareEntryRevisionsFeature` (`Extension.ts:56`) has no entitlement check at all.**

### Provider and model selection

The **customer's configuration decides**; the caller names a capability, not a model. Precedence
(`ResolveAiCapabilityUseCase.ts:113-172`):

1. Capability-pinned `connectionId` + `model` — both required, a half-edit is ignored (`:126-134`)
2. The capability's overridden role, else its `defaultRole` (`:136-145`)
3. Fall back to the `standard` role (`:154-164`)
4. Otherwise fail (`:169`)

Roles are `["fast", "standard", "vision"]`
(`packages/ai-powerups/src/api/features/ModelRoles/roles.ts:14`). `fast` and `vision` fall back to
`standard` when unfilled — with an explicit note (`:151-157`) that an unfilled `vision` role sends
images to whatever `standard` holds.

The compare capability declares `defaultRole: "fast"`
(`packages/ai-powerups/src/api/features/CmsCompareEntryRevisions/capability.ts`). A project can
override it per capability, which is the "CMS revision compare settings" the brief refers to.

There is **no environment-variable fallback**, deliberately (`ResolveAiCapabilityUseCase.ts:23-24`).

### Rate limiting, cost control, usage accounting

**All absent.** Repo-wide grep for `rateLimit`, `quota`, `tokensUsed`, `totalTokens` across
`ai-powerups/src/api` and `api-core/src/features/ai` returns two unrelated hits:
`AiPromptContext`'s `totalTokens` (`features/AiPromptContext/abstractions.ts:62`) is a prompt-budget
estimate for project files, not usage accounting.

`GenerateEntryContentTelemetry`
(`features/CmsGenerateEntryContent/CmsGenerateEntryContentUseCase.ts:143-150`) records `filesRead`,
`cacheHit`, `toolCallsMade`, `totalSteps`, `toolsAvailable`, `imageTagsInPrompt` — diagnostics only.
**No token counts, no cost, nothing persisted.**

### Existing callers

`packages/ai-powerups/src/api/features/CmsCompareEntryRevisions/CmsCompareEntryRevisionsUseCase.ts:76-82`
is the closest structural example to what the brief describes — resolve capability, build prompt,
`ai.generateText`, parse.

**One finding that contradicts the brief's framing.** That use case's `summary` (`:88-101`) is not a
prose summary. It is regex-derived and resolves to `"No differences detected between versions"`,
`"Content comparison completed"`, or `"N fields changed"` — the `<h2>/<h3>` branch can only fire if
the model breaks the prompt's own output contract, which specifies no heading outside the
no-changes case. The substantive output is `html`.

Separately, the compare prompt explicitly instructs the model to emit values: "The value in Version
A / The value in Version B", with the worked example _"Title changed from 'Launch Plan' to 'Updated
Launch Plan'"_ (`features/CmsCompareEntryRevisions/capability.ts`, `guidance`).

---

## Task 4 — Background task payload storage

**The brief's premise is wrong. Payloads are persisted, not transient.**

### Where the payload lives

In a **private CMS model**, not a dedicated table.
`packages/background-tasks/src/api/crud/TaskPrivateModel.ts:4` declares `wbyTask`, built via
`builder.private(...)` (`:10`), with the payload at `input: fields.json()` (`:23`) and the result at
`output: fields.json()` (`:24`).

So it lands wherever CMS entries land: the primary DynamoDB table on `ddb`, the SQL store on `sql`.
On `ddb-es` it is **also indexed into OpenSearch** —
`packages/api-headless-cms-ddb-es/src/tasks/CreateElasticsearchIndexTask.ts:15` enumerates models
via `ListModelsUseCase.execute()` with no private-model exclusion.

The Step Functions execution input carries only
`{ webinyTaskId, webinyTaskDefinitionId, tenant, delay }`
(`packages/background-tasks-aws/src/service/StepFunctionService.ts:46-51`) — **not the payload**.
The runner reads it back from the entry by id.

### Retention after completion

**Indefinite by default.** Cleanup is opt-in per definition via `selfCleanup`, honoured by
`SelfCleaningTaskHandlerDecorator` on `onDone`/`onError`/`onAbort`
(`packages/background-tasks/src/api/decorators/SelfCleaningTaskHandlerDecorator.ts:42-60`), which
calls `cleanupTaskSubtree` only if the event was asked for (`:63-72`).

`normalizeSelfCleanup(undefined)` returns an **empty set**
(`packages/background-tasks/src/api/utils/normalizeSelfCleanup.ts:12-14`), and
`TaskDefinitionDefaultsDecorator` supplies no default for it (`:59-61` passes it straight through,
unlike `isPrivate` / `databaseLogs` / `maxIterations` which all get defaults at `:42-57`).

**A task definition that does not set `selfCleanup` keeps its record, including the full input
payload, forever.**

### Expiry mechanism

**Absent.** No TTL anywhere in `background-tasks/src/api` — grep for `expiresAt`, `ttl`, `TTL`
returns nothing. The only deletions are `selfCleanup`, the `deleteTask` GraphQL mutation
(`graphql/BackgroundTasksContextualSchema.ts:271`), and the failure rollback at
`crud/service.tasks.ts:111`. Nothing is automatic and time-based.

### Payload size limit

**No explicit limit and no validation.** `packages/background-tasks/src/api/crud/service.tasks.ts:68-73`
builds the create data and `:85` writes it via `createTask`; the only pre-flight check is
`validateDelay` (`:78`). The effective ceiling is the storage's — the DynamoDB 400 KB item limit on
`ddb`, column limits on `sql`. An oversized payload surfaces as a storage error from the CMS write,
which `:86-89` rethrows, and the task is never created.

### Triggering from inside a write

Precedent exists and it **is** in the write path.
`packages/ai-powerups/src/api/features/AiImageEnrichment/AiImageEnrichmentAfterCreateHandler.ts:16`
`await`s `taskService.trigger(...)` inside a file after-create handler.

Cost per trigger, from `crud/service.tasks.ts:83-103`: one **CMS entry write** (`createTask`, `:85`)
plus one **Step Functions `StartExecution`** call (`service.send`, `:93` →
`StepFunctionService.ts:55-60`), both awaited. If `send` fails, the task entry is deleted and the
error rethrown (`:111-112`) — so a dispatch failure propagates into the caller unless the caller
contains it.

---

## Premises contradicted

1. **"We have since been told field-level permissions are supported today."** They are not. The
   evaluator still returns `false` unconditionally with its TODO intact, it is client-side, and no
   API path enforces field rules. The entitlement gates the _authoring UI_ only.
2. **"Values are transiently present rather than stored."** Task input is persisted as a CMS entry
   field and, absent `selfCleanup`, retained indefinitely — and additionally indexed into OpenSearch
   on `ddb-es`.
3. **"What is available in the request context… headers, user agent."** Neither is reachable; only
   tenant id and auth token are lifted from the event. Locale does not exist as a request-context
   concept at all.
4. **"Use the model from the CMS revision compare settings."** There is no compare-specific model
   setting. The model comes from capability resolution — a per-capability override if set, else the
   `fast` role, else `standard`.
5. **"Save the summary into the activity log."** The compare use case's `summary` is a regex-derived
   count string, not prose. The informative output is `html`, which the prompt requires to quote
   values.
