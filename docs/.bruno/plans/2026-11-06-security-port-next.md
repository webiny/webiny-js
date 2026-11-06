# Port 6.x security fixes to `next`

Branch: `bruno/fix/next/security-issues-2026-11-06`.

Sources:

- PR #6178 (`release/6.5.2`). It contains every fix in PR #6173 (`release/6.4.12`).
- The researcher brief for `next`. Its three issues are folded into phases 1 to 4 below.

Rules for this work:

- Do not commit until the user approves the diff and the test results. This rule comes from the brief and overrides the usual commit-after-fix rule.
- Run tests one at a time and by file path.
- Follow the DI conventions: one item per file, no `Impl` suffix, no wrapper helpers around use case calls.

## Triage summary

| 6.x commit | Topic | `next` verdict |
|---|---|---|
| 553fb562f1, 5014e71f88 | Cookie auth limited to `/private/*` | Port as full cookie removal (brief) |
| e743ba0401, 1cca5a011b | `parseJson` and request bodies | Needs port |
| 96035cdeb7, a3ee4081bd | `parseJson` for caller-supplied and stored JSON | Needs port |
| 885133a448 | Keep the 4xx status of Fastify client errors | No Fastify on `next`, but same gap: every error becomes 500 |
| 5220360c22, 9981af89e1 | GraphQL and CMS GraphQL accept only `application/json` | Needs port |
| d97e39a008 | Own-entries check on reads by id | Needs port |
| 6fcd5bc069, 762f97f961, 8d608ef1af, 976d4bd833, 3b33bd71da | Private models | Needs port |
| f86530e98a, 27b4cf52e0 | Scheduler cancel needs target permission | Needs port |
| 8cfc1e86a0, 132cd8cb26 | CMS and Website Builder scheduler permissions | Needs port |
| 81b229555d, f6dabb539e, 8d1fde6649 | Bulk actions | Needs port. Code is in `BulkActionsGraphQLSchema.ts` |
| 88eac34a6f | Background tasks | Permission part needs port. Private-task part is already fixed |
| 977cc28df0 | File Manager settings validation | Needs port. `next` also wipes `srcPrefix` on partial updates |
| 3e36a86114, a9a9ea6a8f | Private file authorizer | Needs port. Anonymous callers pass the `!identity` check |
| a438ae6fbc, 9b492afe4a | `isAnonymous()` | Needs port. Websockets has an anonymous-connect bug that exists only on `next` |
| 49af607186, 7b419e5cd0, f95169770a | ai-powerups | Needs port |
| c7234f3483 | Collaboration threads on private models | Needs port. The package has no test setup yet |
| 343f22f566 | ai-powerups `export default` | Not applicable (style only) |

Facts checked in code:

- `SetIdTokenCookie.ts` is not registered and not exported, so the API never sets `wby-id-token`.
- `next` has no `/private/*` HTTP route. `AssetDeliveryRoute` serves only `/files/*`. Private file delivery is therefore broken today. That is a separate issue and out of scope.

## Phase 1: Cookie and CORS (brief issue 1, steps 1 to 4)

1. **Remove the cookie fallback**
   - `api-event-handler-aws/src/handlers/extractRequestAuth.ts`: remove the fallback in `extractAuthToken` and delete `parseCookieHeader`.
   - `api-event-handler-standalone/src/handlers/NodeHttpIdentityLoaderDecorator.ts`: remove the fallback in `extractToken` and update the doc comment.
   - `event-handler-aws/src/translators/functionUrlEventToHttpRequest.ts`: fix the comment. Keep the `cookies` folding only if another reader needs it.
2. **Delete the unused cookie setter:** `api-core/.../AuthenticationContext/SetIdTokenCookie.ts`. It is not exported.
3. **Stop allowing credentials in CORS:** in `event-handler-core/.../SecureHeadersDecorator.ts`, drop `access-control-allow-credentials` in `route()` and `optionsResponse()`. Keep the reflected origin, or `*`, and keep `vary: origin`.
4. **Stop forwarding the cookie in CloudFront:** `project-aws/src/pulumi/apps/api/ApiCloudfront.ts`.
   - Remove `wby-id-token` from the legacy `forwardedValues`.
   - Remove it from the streaming `OriginRequestPolicy`.
   - Set cookie forwarding to `none`.
5. **Tests**
   - CORS response and preflight tests in `event-handler-core/__tests__`.
   - Tests that a request with only a cookie is anonymous, in `api-event-handler-aws/__tests__` and `api-event-handler-standalone/__tests__`.

## Phase 2: Body parsing, content type and 4xx errors (brief issues 1.5 and 2; 6.x 1cca5a011b, 885133a448, 5220360c22, 9981af89e1)

1. **Add a safe JSON parser:** `@webiny/utils` gets `parseJson.ts`, built on `secure-json-parse` with `protoAction` and `constructorAction` set to `"error"`. Port the 6.x tests. Use it in `utils/src/cursor.ts`. It goes in utils because about 20 packages need it; the event-handler packages add `@webiny/utils` as a dependency.
2. **Add a client error type:** event-handler-core gets `HttpClientError(statusCode, code, message)`. Map it to its status in the three router handlers:
   - `ApiGatewayHttpRouterHandler`
   - `FunctionUrlStreamRouterHandler`
   - `NodeHttpRouterHandler`
3. **Change the request translators**
   - All three translators parse JSON only when the content type is `application/json`. This changes `apiGatewayEventToHttpRequest`. Other text bodies stay strings.
   - All three use `parseJson`.
   - Invalid JSON keeps the current fallback: the body stays a raw string.
   - A prototype-pollution key throws `HttpClientError(400)`.
4. **Reject non-JSON GraphQL requests**
   - `api-graphql`: `GraphQLRoute` returns 415 for a non-JSON content type, with `cache-control: no-store`.
   - `createRequestBody` no longer parses strings. A string or invalid body gives `GRAPHQL_REQUEST_INVALID`, mapped to 400.
   - Export the content-type helper from api-graphql.
   - Apply the same check to `api-headless-cms/src/createCmsRoute.ts`.
5. **Admin Assistant:** `parseChatBody.ts` uses `parseJson` and rejects non-JSON content types.
6. **Tests**
   - A `text/plain` GraphQL POST gives 415, on both the core route and the CMS route.
   - A JSON body with `__proto__` gives 400 on each transport.

## Phase 3: `parseJson` sweep (96035cdeb7, a3ee4081bd)

**Caller-supplied JSON**
- `ai-powerups` `LlmJsonResponse.ts`
- `api-audit-logs-ddb` `cursorSchema.ts`
- `api-opensearch` `cursors.ts`
- `api-websockets-aws`: `AwsWebsocketsEventValidator.ts` and `WebSocketLambdaHandler.ts`
- `api-websockets` `handler/headers.ts`
- `db-dynamodb` `utils/cursor.ts`
- `lexical-nodes` `prepareLexicalState.ts`
- `validation` `validators/json.ts`
- `api-workflows` `reviewListCursor.ts`
- `api-headless-cms-workflows` `modelListCursor.ts`
- `api-search-index-tasks-ddb-os` `StorageScanner.ts`

**Stored and remote JSON**
- `api-core` `HttpClient.ts`
- `api-headless-cms`: `CompressedTextStorageTransform.ts` and `LongTextStorageTransform.ts`
- `api-sync-system` `createJsonTransform.ts`

**Skipped:** SQL row mappers and DynamoDbDriver, because they parse the database's own data (see Q3).

## Phase 4: CMS own entries on reads by id (brief issue 3; d97e39a008)

**Where the check goes**
- Read use cases get a check after the load, one DI decorator per use case.
  - For lists, drop entries the user doesn't own: `GetEntriesByIds`, `GetLatestEntriesByIds`, `GetPublishedEntriesByIds`, `GetRevisionsByEntryId`.
  - For single entries, return `EntryNotAuthorizedError`: `GetLatestRevisionByEntryId`, `GetPreviousRevisionByEntryId`.
  - `GetRevisionById` and `GetPublishedRevisionByEntryId` have no checks at all today. Add the model check and the entry check.
  - Singleton models are exempt.

**Singleton use cases**
- `GetSingletonEntryUseCase` falls back to create only on `EntryNotFoundError` and propagates every other error. Without this, the entry could be overwritten with empty data.
- `UpdateEntryUseCase` gets the singleton exemption.

**Reference fields**
- These go through `GetLatestEntriesByIds` and `GetPublishedEntriesByIds`, so the change covers them.
- `validateEntries` runs `withoutAuthorization` and is not affected.

**Internal callers to check:** see Q1.
- Workflows target readers
- Scheduler handlers
- ai-powerups compare
- ACO folder permissions

**Tests:** in `__tests__/contentAPI/security/contentEntries/ownEntries.test.ts`, adapted from 6.x.
- Every read path, including the singleton.
- Reading one's own entry by id still works.
- A reference to another user's entry resolves to null or is dropped.

## Phase 5: CMS private models (6fcd5bc069, 762f97f961, 8d608ef1af, 976d4bd833, 3b33bd71da)

- `graphql/schema/contentEntries.ts`: pass `{ includePrivate: false }` at the 5 `ListModelsUseCase` calls.
- `contentModels.ts`: `getContentModel` returns not found for a private model.
- `CreateModelFromUseCase`: a private original gives `ModelNotFoundError`.
- `RefToGraphQL.ts`: a private target model gives `[]` or `null`.
- `validateEntries.ts`: refuse references to private models, and keep skipping unknown ones.
- `graphql/schema/cms/helpers/getModel.ts`: treat a private model as not found.
- **Tests:** port `privateModelsGenericQueries.test.ts` and `privateModelsRefFields.test.ts`, using `createPrivateModelPlugin`.

## Phase 6: Schedulers (f86530e98a, 27b4cf52e0, 8cfc1e86a0, 132cd8cb26)

**api-scheduler**
- `CancelScheduledActionUseCase` runs `NamespaceHandlerExecutioner` when authorization is on.
- `ScheduleActionUseCase` returns unexpected errors instead of falling through.
- Add `notAuthorized` to the error maps.
- Export `SchedulerNotAuthorizedError`, from api-scheduler and from `webiny/src/api/scheduler.ts`. Regenerate the export hash.

**CMS scheduler**
- `NamespaceHandler` refuses private models and runs `canAccessEntry({ model, entry, pw })`.
- The delete-cleanup handlers run `withoutAuthorization`.

**Website Builder scheduler**
- The page handler requires `canPublish` or `canUnpublish` plus `canAccess`.
- The redirect handler requires `canEdit`.
- The delete-cleanup handlers run `withoutAuthorization`.

**Tests**
- `api-headless-cms-scheduler/__tests__/schedulePermissions.test.ts`
- `api-website-builder-scheduler/__tests__/schedulePermissions.test.ts`

## Phase 7: Bulk actions (81b229555d, f6dabb539e, 8d1fde6649)

In `BulkActionsGraphQLSchema.ts`:

1. Return no schema unless the endpoint type is `manage`.
2. The resolver checks the action's access before triggering the task:
   - Delete and MoveToTrash need `rwd:d`.
   - Publish needs `pw:p`, Unpublish `pw:u`.
   - Anything else needs `rwd:w`.
3. `moveToFolder` requires a `folderId` and write access to the target folder through `FolderLevelPermissions`. This adds `@webiny/api-aco` as a dependency.

**Tests:** new `__tests__/graphql/endpoints.test.ts`. The `useGraphQLHandler` helper gets an endpoint-type parameter.

The dead files `createBulkActionGraphQL.ts` and `createDefaultGraphQL.ts` stay. Removing them is out of scope.

## Phase 8: Background tasks (88eac34a6f, permission part)

- `checkPermissions.ts` uses `BackgroundTaskPermissions` (`canRead`, `canEdit`, `canDelete` on `"task"`) instead of the ungranted `tasks` permission.
- **Tests:** `__tests__/graphql/permissions.test.ts`. The handler helper gets a permissions argument.

## Phase 9: File Manager (977cc28df0, 3e36a86114, a9a9ea6a8f, part of a438ae6fbc)

**Settings (977cc28df0)**
- `UpdateSettingsUseCase` requires `fm.settings`. Add `SettingsNotAuthorizedError`.
- `srcPrefix` must be an absolute http(s) URL.
- `uploadMinFileSize` may not exceed the maximum, and the merged settings must have min ≤ max.
- Leave `srcPrefix` unchanged when it is `undefined`.
- The installer runs `withoutAuthorization`.

**Private file authorizer (3e36a86114, a9a9ea6a8f)**
- `PrivateAuthenticatedAuthorizer` refuses an anonymous identity and requires `FmPermissions.canRead("file")`.

**File model (part of a438ae6fbc)**
- `FmQuery.getFileModel` refuses anonymous callers.

**Tests**
- `filesSettingsSecurity.test.ts`
- `filesSettingsValidation.test.ts`
- `__tests__/features/assetDelivery/privateAuthenticatedAuthorizer.test.ts`
- An anonymous case in `filesSecurity.test.ts`

## Phase 10: Anonymous identity (a438ae6fbc, 9b492afe4a)

- **Websockets (only on `next`):** `WebsocketsRunner.getIdentity` returns `null` when `isAnonymous()`. Test in `websocketsRunner.test.ts`.
- **api-aco**
  - `FolderLevelPermissions.ts`: use `isAnonymous()`.
  - `GetDefaultPermissionsWithTeams`: return early for anonymous identities.
- **api-core:** remove the dead `if (identity)` in `CreateUserUseCase`.
- **Frontend:** harden `app-aco` `FolderIdentity.ts` and `app-admin` `useSecurity.ts`.

## Phase 11: ai-powerups (49af607186, 7b419e5cd0, f95169770a)

**Settings permission and secrets**
- Add the `aiPowerups.settings` permission to the API and the admin permission schema.
- `GetSettings` strips `apiKeyEncrypted` and shows masked keys only with the permission.
- Add an internal `GetDecryptedSettingsUseCase` that refuses anonymous callers. `ResolveAiCapability` uses it on all its lookup paths.
- `UpdateSettings` requires the permission. The mappers use `||` instead of `??`, as 6.x does.

**Anonymous callers and admin UI**
- `ListModels` and `ListAiCapabilities` refuse anonymous callers.
- New queue use cases for Website Builder and CMS generation refuse anonymous callers.
- The admin settings route and menu go behind `HasPermission`.

**Model access (7b419e5cd0, f95169770a)**
- CMS generation checks the model: not private, plus `canAccessEntry({ rwd: "w" })`.
- `CmsCompareEntryRevisions` checks the model before resolving the capability, refuses private models, and refuses anonymous callers.

**Tests**
- `__tests__/graphql/settingsSecurity.test.ts`
- `__tests__/graphql/cmsSecurity.test.ts`

## Phase 12: Collaboration (c7234f3483)

- `CmsLocatorResolver`: a private model gives `{ exists: false, authorized: false }`.
- Add `vitest.config.ts` and dev dependencies, then `__tests__/cmsLocatorResolver.test.ts`.

## Verification

- Run the tests for each package touched, one at a time.
- Search again for:
  - `wby-id-token`
  - `access-control-allow-credentials`
  - `JSON.parse(` on request bodies
- Run the pre-commit chain: `format:fix`, `lint:fix`, `adio`, tsconfig generation, `sync-dependencies`, build.
- Report back with a summary per phase, the files changed and the test results. Wait for the user's approval to commit.

## Open questions

- **Q1.** Own-entries check and internal callers. Workflows, schedulers, ai-powerups and ACO folder permissions call the read-by-id use cases directly. Proposal: keep the check in the use cases, as 6.x does. Wrap only the internal callers that legitimately need full access in `withoutAuthorization`. One example is a workflow reviewer with own-only CMS rights reading the review target.
- **Q2.** Where `parseJson` lives. Proposal: `@webiny/utils`, as on 6.x, not `event-handler-core` as the brief suggests.
- **Q3.** How far the `parseJson` sweep goes. Proposal: caller-supplied JSON plus the stored and remote sites listed in phase 3. Skip parsing of the database's own rows.
- **Q4.** Scope of the AI permission. Proposal: `aiPowerups.settings` gates only settings, as on 6.x. Next-only AI features keep "logged-in only".
- **Q5.** Websockets anonymous fix, which exists only on `next`. Proposal: include it in this batch.
- **Q6.** Private file delivery is broken on `next` (no `/private/*` route). Proposal: track it separately. Here, only harden the authorizer.

## Decisions (user, 2026-11-06)

- **Q1:** keep the check in the use cases. Wrap internal callers that need full access in `withoutAuthorization`.
- **Q2:** `parseJson` lives in `@webiny/utils`.
- **Q3:** the sweep covers caller-supplied JSON plus stored and remote JSON. It skips the database's own rows.
- **Q4:** use the proposal. `aiPowerups.settings` gates only the settings.
- **Q5:** include the websockets fix in this batch.
- **Q6:** fix private file delivery in this batch as Phase 13.

## Phase 13: Private file delivery route

- Register `GET /private/*` (and HEAD) next to `/files/*`, through the same asset delivery pipeline.
  - `PrivateFileAssetRequestResolver` already handles the `/private/` prefix.
- Auth uses headers only (`Authorization` / `x-webiny-authorization`). No cookie.
- `PrivateAuthenticatedAuthorizer` (phase 9) enforces the rules: no anonymous callers, File Manager read access.
- `/private/*` responses send `cache-control: private` and no credentialed CORS.
- **Fix `HttpRouter.matchPath`:** `"/x/*"` must require a `/` boundary, so `/filesX` does not match. Also guard `decodeURIComponent`.
- **Admin side:**
  - Find where the admin renders private file URLs (`<img src>`, downloads).
  - Load those through `fetch` with the auth header and turn the result into a blob URL.
  - If this turns out to be large, report it before building it.
- **Tests:**
  - Route matching for `/private/*`.
  - An anonymous caller gets 403.
  - A caller without File Manager read access gets 403.
  - A caller with read access gets the file.
