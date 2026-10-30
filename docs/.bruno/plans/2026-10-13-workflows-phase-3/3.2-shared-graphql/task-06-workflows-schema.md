### Task 6: `WorkflowsSchemaFactory`: root, shared types, settings and step types operations, test harness

Spec 10, D133 point 2, D136, R88, R97, R98, R100, R101, R105. One `GraphQLSchemaFactory` in api-workflows puts the `workflows` root on `/graphql` (`getSettings`, `updateSettings`, `listStepTypes`) and defines every shared GraphQL type the CMS (3.3) and WB (3.4) factories reuse, so those add only their envelopes and root fields. Resolvers call only the three R97 use cases (Task 5), inline, and return a failed Result with `new ErrorResponse(result.error)` (code, message and data kept, Review Focus 5). The factory is registered inside the license gate of `WorkflowsFeature`, so without `advancedPublishingWorkflow` nothing is added.

**How the `/graphql` schema is composed (checked at HEAD, binding for 3.3 and 3.4):**
- `GraphQLSchemaComposer.build` (`packages/api-graphql/src/features/GraphQLSchemaBuilder/GraphQLSchemaComposer.ts`) runs every `CoreGraphQLSchemaFactory` and then every `GraphQLSchemaFactory` against **one** `GraphQLSchemaBuilder`. `GraphQLSchemaBuilder.build()` joins all `addTypeDefs` strings into one document and `GraphQLEngine` builds one executable schema from it (`makeExecutableSchema`). A type defined by one factory can therefore be referenced, and a type extended (`extend type CmsQuery`, `extend type WbQuery`, `extend type Query`), by any other factory in the same build, in any registration order. `type CmsQuery` / `CmsMutation` come from `CoreGraphQLSchemaFactory` registrations in `packages/api-headless-cms/src/graphql/schema/cms/typeDefs/{query,mutation}.ts`; `WbQuery` / `WbMutation` from `packages/api-website-builder/src/graphql/createGraphQL.ts`. `JSON` and `DateTime` scalars come from `ApiCoreSchemaFactory`.
- So a CMS or WB envelope such as `type CmsEntryReviewResponse { data: WorkflowsReviewWithFlags error: WorkflowsError }` resolves as long as `WorkflowsSchemaFactory` is registered in the same container. All three factories sit behind the same `advancedPublishingWorkflow` gate, and the app features need `WorkflowsFeature` anyway, so they are present or absent together. An app factory registered without `WorkflowsFeature` would fail the schema build (unknown type); that is a wiring error, not a supported setup.
- Schema cache on `/graphql`: `GraphQLEngine` keys `MemoryGraphQLSchemaCache` by `createSchemaCacheKey`, a hash of the full type definitions plus resolver and decorator paths (`packages/api-graphql/src/engine/createSchemaCacheKey.ts`), and `createCmsTestHandler` registers the cache in its own root container per handler. A licensed and an unlicensed schema therefore never share an entry. The CMS-endpoint gotcha (`phase3-cms-graphql.md` §7.5: the `/cms/*` cache key ignores the factory set) does not apply here. The license test still gets its own file, so a future change to either cache cannot make it order dependent.
- Input dates are `String` (not `DateTime`): the `DateTime` scalar parses input into a `Date` object, while the engine compares and stores ISO strings (`endsOn`, and the workflow `savedOn` in 3.3 / 3.4, D131). Output dates are `DateTime` (ISO serialization).

**Files:**
- Create: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/package.json` (`@webiny/api-graphql` in `dependencies`, R101; `@webiny/wcp` in `devDependencies` for the test license, see Step 1)
- Modify: `packages/api-workflows/__tests__/__helpers/handler.ts`
- Create: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Create: `packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts`

**Interfaces:**
- Consumes:
  - Task 5: `GetWorkflowSettingsForEditorUseCase` (`~/features/config/GetWorkflowSettingsForEditor/index.js`), `execute(input?: GetWorkflowSettingsForEditorInput): Promise<Result<WorkflowSettings, GetWorkflowSettingsForEditorUseCase.Error>>` (`GetWorkflowSettingsForEditorInput { includeExpired?: boolean | null }`); `SaveWorkflowSettingsForEditorUseCase` (`~/features/config/SaveWorkflowSettingsForEditor/index.js`), `execute(input: WorkflowSettings): Promise<Result<WorkflowSettings, SaveWorkflowSettingsForEditorUseCase.Error>>`; `ListWorkflowStepTypesUseCase` (`~/features/config/ListWorkflowStepTypes/index.js`), `execute(): Promise<Result<WorkflowStepTypeInfo[], ListWorkflowStepTypesUseCase.Error>>`; `WorkflowStepTypeInfo { type: string; title: string; available: boolean; unavailableReason: string | null; configSchema: Record<string, unknown> | null }` (`~/domain/config/types.js`). All three registered by Task 5 inside `WorkflowsFeature`'s gate. Refusal action texts (Task 5): `"view the workflow settings"`, `"change the workflow settings"`, `"list the step types"`.
  - `WorkflowSettings`, `WorkflowExclusion` (`~/domain/settings/types.js`).
  - `GraphQLSchemaFactory` (`@webiny/api-graphql/graphql/abstractions.js`), `Response`, `ErrorResponse` (`@webiny/api-graphql`).
  - Engine types the shared SDL mirrors: `ReviewData` (with `currentStepType: string | null`, Task 1), `ReviewStep`, `ReviewStepAssignment`, `Actor`, `TargetContext`, `ReviewWorkflowSnapshot`, `ReviewViewerFlags`, `ReviewWithViewerFlags` (`~/domain/review/types.js`); `Workflow`, `WorkflowValues`, `WorkflowStep` (`~/domain/workflow/types.js`); `AssignmentRecord` with `kind: "outcome" | "skip"` (Task 4); `ReviewListKind`, `ReviewListSort` (Task 3).
  - `createCmsTestHandler` return (`invoke`, `createQuery`, `createMutation`, `introspect`) from `@webiny/api-headless-cms-testing`; `createTestWcpLicense` (`@webiny/wcp/testing/createTestWcpLicense.js`), `PROJECT_PACKAGE_FEATURE_NAME` (`@webiny/wcp/types.js`).
- Produces:
  - `WorkflowsSchemaFactory` (`packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`), a `GraphQLSchemaFactory` implementation, not exported from the barrel (registered by `WorkflowsFeature`).
  - Root: `type WorkflowsQuery { getSettings(includeExpired: Boolean): WorkflowsSettingsResponse!  listStepTypes: WorkflowsStepTypeListResponse! }`, `type WorkflowsMutation { updateSettings(data: WorkflowsSettingsInput!): WorkflowsSettingsResponse! }`, `extend type Query { workflows: WorkflowsQuery! }`, `extend type Mutation { workflows: WorkflowsMutation! }`.
  - Shared GraphQL types for 3.3 / 3.4 (exact SDL in Step 4): `WorkflowsError`, `WorkflowsListMeta`, `WorkflowsBooleanResponse`, `WorkflowsActor`, `WorkflowsStepNotification`, `WorkflowsStep`, `WorkflowsWorkflow`, `WorkflowsStepNotificationInput`, `WorkflowsStepInput`, `WorkflowsWorkflowInput`, `WorkflowsReviewState`, `WorkflowsStepState`, `WorkflowsAssignmentKind`, `WorkflowsReviewStepAssignment`, `WorkflowsAssignmentEntry`, `WorkflowsReviewStep`, `WorkflowsReviewTargetFolder`, `WorkflowsReviewTargetAuthor`, `WorkflowsReviewTargetContext`, `WorkflowsReviewWorkflow`, `WorkflowsReview`, `WorkflowsViewerFlags`, `WorkflowsReviewWithFlags`, `WorkflowsReviewListKind`, `WorkflowsReviewListSort`, `WorkflowsReviewListWhere`, `WorkflowsReviewPickInput { stepId: String! userId: String! }`, `WorkflowsReviewsForDeleteAction { trash delete }` (R100: both apps use them for the request picks and the cancel-for-delete action).
  - Settings and step types: `WorkflowsExclusion`, `WorkflowsSettings`, `WorkflowsSettingsResponse`, `WorkflowsExclusionInput`, `WorkflowsSettingsInput`, `WorkflowsStepType`, `WorkflowsStepTypeListResponse`.
  - Notes for 3.3 / 3.4: `WorkflowsReviewStep.assignments` is filled only where the wrapper attached `assignments` to the step (get review wrappers, R96); elsewhere it resolves to `null`. `WorkflowsReviewListWhere.modelId` is for the CMS list (R94); the WB list has no model filter. Input dates (`savedOn` of `storeCmsEntryWorkflow` / `storeWebsiteBuilderPageWorkflow`) must be declared `String`, not `DateTime`.
  - Test harness: `createContextHandler(params)` in `packages/api-workflows/__tests__/__helpers/handler.ts` returns `{ handler, context, invoke, createQuery, createMutation, introspect }`.

- [ ] **Step 1: Dependencies and the test harness**

In `packages/api-workflows/package.json`, add `"@webiny/api-graphql": "0.0.0"` to `dependencies` after `"@webiny/api-core"` (R101). The tests build a license with AI powerups and one without `advancedPublishingWorkflow`, which needs `createTestWcpLicense` from `@webiny/wcp`; add `"@webiny/wcp": "0.0.0"` to `devDependencies` after `"@webiny/plugins"` (Task 5 adds no dependency; it is a test-only dependency, the same one `api-headless-cms-workflows` and `api-website-builder-workflows` list). The relevant parts afterwards:

```json
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-core": "0.0.0",
    "@webiny/api-graphql": "0.0.0",
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/api-mailer": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@webiny/api-core-testing": "0.0.0",
    "@webiny/api-headless-cms-testing": "0.0.0",
    "@webiny/build-tools": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "@webiny/wcp": "0.0.0",
    "type-fest": "^5.8.0",
    "typescript": "^7.0.2",
    "vitest": "^4.1.11"
  },
```

Run: `yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio`
Expected: `adio` passes; `packages/api-workflows/tsconfig.json` gains the `api-graphql` and `wcp` references and paths.

Replace `packages/api-workflows/__tests__/__helpers/handler.ts` with:

```ts
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { Container } from "@webiny/feature/api";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";

/** The part of the request context the tests read. `getContext()` is otherwise `Record<string, any>`. */
export interface WorkflowsTestContext {
    container: Container;
}

/**
 * Request context with `WorkflowsFeature` registered. `params.setup` runs after it, so tests can
 * register fakes and decorators on top of the workflows abstractions. The same handler also serves
 * GraphQL on `/graphql`: `invoke`, `createQuery`, `createMutation` and `introspect`.
 */
export const createContextHandler = async (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        setup: async container => {
            WorkflowsFeature.register(container);
            await params.setup?.(container);
        },
        permissions: params.permissions ?? [{ name: "*" }]
    });
    const context = await handler.getContext<WorkflowsTestContext>();

    return {
        handler,
        context,
        invoke: handler.invoke,
        createQuery: handler.createQuery,
        createMutation: handler.createMutation,
        introspect: handler.introspect
    };
};
```

- [ ] **Step 2: Write the failing tests**

Create `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { createContextHandler } from "~tests/__helpers/handler.js";

const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }];
/** Has a workflows permission, but not `editor`. */
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const SETTINGS_FIELDS = /* GraphQL */ `
    data {
        exclusions {
            userId
            reason
            endsOn
        }
    }
    ${ERROR_FIELDS}
`;

const GET_SETTINGS = /* GraphQL */ `
    query GetSettings($includeExpired: Boolean) {
        workflows {
            getSettings(includeExpired: $includeExpired) {
                ${SETTINGS_FIELDS}
            }
        }
    }
`;

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateSettings($data: WorkflowsSettingsInput!) {
        workflows {
            updateSettings(data: $data) {
                ${SETTINGS_FIELDS}
            }
        }
    }
`;

const LIST_STEP_TYPES = /* GraphQL */ `
    query ListStepTypes {
        workflows {
            listStepTypes {
                data {
                    type
                    title
                    available
                    unavailableReason
                    configSchema
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

interface ErrorRow {
    code: string;
    message: string;
    data: unknown;
}

interface ExclusionRow {
    userId: string;
    reason: string | null;
    endsOn: string | null;
}

interface SettingsRow {
    exclusions: ExclusionRow[];
}

interface SettingsEnvelope {
    data: SettingsRow | null;
    error: ErrorRow | null;
}

interface JsonSchemaRow {
    type?: string;
    properties?: Record<string, unknown>;
}

interface StepTypeRow {
    type: string;
    title: string;
    available: boolean;
    unavailableReason: string | null;
    configSchema: JsonSchemaRow | null;
}

interface StepTypesEnvelope {
    data: StepTypeRow[] | null;
    error: ErrorRow | null;
}

interface GetSettingsResult {
    getSettings: SettingsEnvelope;
}

interface UpdateSettingsResult {
    updateSettings: SettingsEnvelope;
}

interface ListStepTypesResult {
    listStepTypes: StepTypesEnvelope;
}

interface WorkflowsRoot<TResult> {
    workflows: TResult;
}

interface GraphQLBody<TData> {
    data: TData;
}

interface IntrospectionNamedRow {
    name: string;
}

interface IntrospectionTypeRow {
    name: string;
    fields: IntrospectionNamedRow[] | null;
    inputFields: IntrospectionNamedRow[] | null;
    enumValues: IntrospectionNamedRow[] | null;
}

interface IntrospectionSchemaRow {
    types: IntrospectionTypeRow[];
}

interface IntrospectionData {
    __schema: IntrospectionSchemaRow;
}

const createApi = async (params: CmsTestHandlerParams) => {
    const { createQuery, createMutation } = await createContextHandler(params);
    return {
        getSettings: createQuery<GraphQLBody<WorkflowsRoot<GetSettingsResult>>>(GET_SETTINGS),
        updateSettings:
            createMutation<GraphQLBody<WorkflowsRoot<UpdateSettingsResult>>>(UPDATE_SETTINGS),
        listStepTypes:
            createQuery<GraphQLBody<WorkflowsRoot<ListStepTypesResult>>>(LIST_STEP_TYPES)
    };
};

const notAuthorized = (action: string): SettingsEnvelope => {
    return {
        data: null,
        error: {
            code: "Workflows/NotAuthorized",
            message: `You are not allowed to ${action}.`,
            data: { action }
        }
    };
};

/** Field, input field or enum value names of one type, in SDL order. */
const memberNames = (types: IntrospectionTypeRow[], name: string): string[] => {
    const type = types.find(item => item.name === name);
    const members = type?.fields ?? type?.inputFields ?? type?.enumValues ?? [];
    return members.map(member => member.name);
};

describe("workflows GraphQL root", () => {
    it("returns and updates the settings for an editor (D133)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [initial] = await api.getSettings();
        expect(initial.data.workflows.getSettings).toEqual({
            data: { exclusions: [] },
            error: null
        });

        const [updated] = await api.updateSettings({
            data: {
                exclusions: [
                    { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                    { userId: "user-b", endsOn: PAST }
                ]
            }
        });
        expect(updated.data.workflows.updateSettings).toEqual({
            data: {
                exclusions: [
                    { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                    { userId: "user-b", reason: null, endsOn: PAST }
                ]
            },
            error: null
        });

        const [active] = await api.getSettings();
        expect(active.data.workflows.getSettings.data).toEqual({
            exclusions: [{ userId: "user-a", reason: "On leave", endsOn: FUTURE }]
        });

        const [all] = await api.getSettings({ includeExpired: true });
        expect(all.data.workflows.getSettings.data?.exclusions.map(row => row.userId)).toEqual([
            "user-a",
            "user-b"
        ]);
    });

    it("refuses the settings to a user without editor, with code and data", async () => {
        const reassigner = await createApi({ permissions: REASSIGNER });

        const [read] = await reassigner.getSettings();
        expect(read.data.workflows.getSettings).toEqual(
            notAuthorized("view the workflow settings")
        );

        const [write] = await reassigner.updateSettings({
            data: { exclusions: [{ userId: "user-a" }] }
        });
        expect(write.data.workflows.updateSettings).toEqual(
            notAuthorized("change the workflow settings")
        );

        const editor = await createApi({ permissions: EDITOR });
        const [stored] = await editor.getSettings({ includeExpired: true });
        expect(stored.data.workflows.getSettings.data).toEqual({ exclusions: [] });
    });

    it("returns the settings validation error with code and data", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.updateSettings({
            data: {
                exclusions: [{ userId: "user-a" }, { userId: "user-a", endsOn: FUTURE }]
            }
        });

        expect(response.data.workflows.updateSettings).toEqual({
            data: null,
            error: {
                code: "Workflows/Settings/Validation",
                message: "This user is already in the list. Edit it instead.",
                data: { userId: "user-a" }
            }
        });
    });

    it("lists the step types with AI unavailable without AI powerups (D130)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [response] = await api.listStepTypes();
        const { data, error } = response.data.workflows.listStepTypes;

        expect(error).toBeNull();
        expect(data?.map(row => row.type)).toEqual(["review", "ai", "automation"]);
        const [review, ai, automation] = data ?? [];
        expect(review).toMatchObject({
            title: "Review",
            available: true,
            unavailableReason: null
        });
        expect(review.configSchema).toMatchObject({ type: "object" });
        expect(Object.keys(review.configSchema?.properties ?? {})).toEqual([
            "teams",
            "assignment"
        ]);
        expect(ai).toEqual({
            type: "ai",
            title: "AI",
            available: false,
            unavailableReason: "AI powerups are not enabled.",
            configSchema: null
        });
        expect(automation).toEqual({
            type: "automation",
            title: "Automation",
            available: false,
            unavailableReason: "No automation is defined.",
            configSchema: null
        });
    });

    it("lists AI as available with AI powerups (D130)", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.AI_POWERUPS] = {
            enabled: true,
            options: { cms: { entryGeneration: true } }
        };
        const api = await createApi({ permissions: EDITOR, testProjectLicense: license });

        const [response] = await api.listStepTypes();
        const ai = response.data.workflows.listStepTypes.data?.find(row => row.type === "ai");

        expect(ai).toEqual({
            type: "ai",
            title: "AI",
            available: true,
            unavailableReason: null,
            configSchema: null
        });
    });

    it("refuses the step types to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listStepTypes();

        expect(response.data.workflows.listStepTypes).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list the step types.",
                data: { action: "list the step types" }
            }
        });
    });

    it("exposes the shared types the app schemas reuse (R100)", async () => {
        const { introspect } = await createContextHandler({ permissions: EDITOR });

        const [body] = await introspect();
        const introspection: GraphQLBody<IntrospectionData> = body;
        const types = introspection.data.__schema.types;

        expect(memberNames(types, "Query")).toContain("workflows");
        expect(memberNames(types, "Mutation")).toContain("workflows");
        expect(memberNames(types, "WorkflowsQuery")).toEqual(["getSettings", "listStepTypes"]);
        expect(memberNames(types, "WorkflowsMutation")).toEqual(["updateSettings"]);
        expect(memberNames(types, "WorkflowsError")).toEqual(["code", "message", "data", "stack"]);
        expect(memberNames(types, "WorkflowsListMeta")).toEqual(["cursor", "hasMoreItems"]);
        expect(memberNames(types, "WorkflowsBooleanResponse")).toEqual(["data", "error"]);
        expect(memberNames(types, "WorkflowsActor")).toEqual([
            "type",
            "id",
            "displayName",
            "identityType"
        ]);
        expect(memberNames(types, "WorkflowsWorkflow")).toEqual([
            "id",
            "name",
            "models",
            "steps",
            "createdOn",
            "savedOn",
            "createdBy",
            "savedBy"
        ]);
        expect(memberNames(types, "WorkflowsWorkflowInput")).toEqual([
            "id",
            "name",
            "models",
            "steps"
        ]);
        const stepFields = [
            "id",
            "title",
            "color",
            "description",
            "type",
            "notifications",
            "config"
        ];
        expect(memberNames(types, "WorkflowsStep")).toEqual(stepFields);
        expect(memberNames(types, "WorkflowsStepInput")).toEqual(stepFields);
        expect(memberNames(types, "WorkflowsReview")).toEqual([
            "id",
            "workflowId",
            "model",
            "targetId",
            "targetRevisionId",
            "title",
            "isActive",
            "state",
            "currentStepId",
            "currentStepState",
            "currentStepType",
            "currentOwnerId",
            "currentCandidateTeamIds",
            "targetContext",
            "workflow",
            "steps",
            "createdBy",
            "createdOn",
            "savedOn",
            "lastChangedOn"
        ]);
        expect(memberNames(types, "WorkflowsReviewStep")).toEqual([
            ...stepFields,
            "state",
            "owner",
            "comment",
            "pickedUserId",
            "candidateTeamIds",
            "assignmentSource",
            "assignment",
            "reachedOn",
            "startedOn",
            "finishedOn",
            "assignments"
        ]);
        expect(memberNames(types, "WorkflowsAssignmentEntry")).toEqual([
            "id",
            "kind",
            "userId",
            "assignedOn",
            "source",
            "by",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsAssignmentKind")).toEqual(["outcome", "skip"]);
        expect(memberNames(types, "WorkflowsViewerFlags")).toEqual([
            "canStart",
            "canTakeOver",
            "canApprove",
            "canReject",
            "canCancel",
            "canReassign",
            "canRestart"
        ]);
        expect(memberNames(types, "WorkflowsReviewWithFlags")).toEqual(["review", "flags"]);
        expect(memberNames(types, "WorkflowsReviewListKind")).toEqual([
            "assignedToMe",
            "pool",
            "teamInReview",
            "myRequests",
            "failedSteps"
        ]);
        expect(memberNames(types, "WorkflowsReviewListSort")).toEqual([
            "lastChangedOn_ASC",
            "lastChangedOn_DESC"
        ]);
        expect(memberNames(types, "WorkflowsReviewListWhere")).toEqual([
            "modelId",
            "titleContains",
            "reviewState",
            "stepState"
        ]);
        expect(memberNames(types, "WorkflowsReviewPickInput")).toEqual(["stepId", "userId"]);
        expect(memberNames(types, "WorkflowsReviewsForDeleteAction")).toEqual(["trash", "delete"]);
        expect(memberNames(types, "WorkflowsReviewState")).toEqual([
            "inProgress",
            "approved",
            "rejected",
            "cancelled"
        ]);
        expect(memberNames(types, "WorkflowsStepState")).toEqual([
            "pending",
            "awaiting",
            "inReview",
            "approved",
            "rejected",
            "failed"
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts` (its own file, see the schema cache note above):

```ts
import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { createContextHandler } from "~tests/__helpers/handler.js";

interface IntrospectionNamedRow {
    name: string;
}

interface IntrospectionTypeRow {
    name: string;
    fields: IntrospectionNamedRow[] | null;
}

interface IntrospectionSchemaRow {
    types: IntrospectionTypeRow[];
}

interface IntrospectionData {
    __schema: IntrospectionSchemaRow;
}

interface IntrospectionBody {
    data: IntrospectionData;
}

describe("workflows GraphQL without the license", () => {
    it("adds no workflows type or root field without advancedPublishingWorkflow (R100)", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { introspect } = await createContextHandler({ testProjectLicense: license });

        const [body] = await introspect();
        const introspection: IntrospectionBody = body;
        const types = introspection.data.__schema.types;

        expect(types.filter(type => type.name.startsWith("Workflows"))).toEqual([]);
        for (const root of ["Query", "Mutation"]) {
            const fields = types.find(type => type.name === root)?.fields ?? [];
            expect(fields.map(field => field.name)).not.toContain("workflows");
        }
    });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/graphql 2>&1 | tail -50`
Expected: every test in `workflowsSchema.test.ts` FAILS (`TypeError: Cannot read properties of undefined (reading 'workflows')`, because the body has `errors` with `Cannot query field "workflows" on type "Query"` and no `data`; the introspection test fails on `expect(...).toContain("workflows")`). `workflowsSchemaLicense.test.ts` PASSES already (it guards the gate; it must keep passing after Step 5). Record the output.

- [ ] **Step 4: The schema factory**

Create `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`:

```ts
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { ErrorResponse, Response } from "@webiny/api-graphql";
import { GetWorkflowSettingsForEditorUseCase } from "~/features/config/GetWorkflowSettingsForEditor/index.js";
import { SaveWorkflowSettingsForEditorUseCase } from "~/features/config/SaveWorkflowSettingsForEditor/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";
import type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";

interface GetSettingsArgs {
    includeExpired?: boolean | null;
}

interface ExclusionInputArgs {
    userId: string;
    reason?: string | null;
    endsOn?: string | null;
}

interface SettingsInputArgs {
    exclusions: ExclusionInputArgs[];
}

interface UpdateSettingsArgs {
    data: SettingsInputArgs;
}

/** GraphQL sends `null` for omitted optional input fields; the engine types use absent keys. */
const toWorkflowSettings = (input: SettingsInputArgs): WorkflowSettings => {
    return {
        exclusions: input.exclusions.map((exclusion): WorkflowExclusion => {
            return {
                userId: exclusion.userId,
                ...(exclusion.reason ? { reason: exclusion.reason } : {}),
                ...(exclusion.endsOn ? { endsOn: exclusion.endsOn } : {})
            };
        })
    };
};

/**
 * The shared types every workflows schema reuses (R100). The CMS and Website Builder factories
 * reference them by name and add only their envelopes and root fields; all factories build into
 * one `/graphql` type document, so the order of registration does not matter.
 */
const SHARED_TYPE_DEFS = /* GraphQL */ `
    type WorkflowsError {
        code: String
        message: String
        data: JSON
        stack: String
    }

    type WorkflowsListMeta {
        cursor: String
        hasMoreItems: Boolean!
    }

    type WorkflowsBooleanResponse {
        data: Boolean
        error: WorkflowsError
    }

    type WorkflowsActor {
        type: String!
        id: ID!
        displayName: String!
        identityType: String
    }

    type WorkflowsStepNotification {
        id: String!
    }

    type WorkflowsStep {
        id: ID!
        title: String!
        color: String!
        description: String
        type: String!
        notifications: [WorkflowsStepNotification!]!
        config: JSON
    }

    type WorkflowsWorkflow {
        id: ID!
        name: String!
        models: [String!]!
        steps: [WorkflowsStep!]!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: WorkflowsActor!
        savedBy: WorkflowsActor!
    }

    input WorkflowsStepNotificationInput {
        id: String!
    }

    input WorkflowsStepInput {
        id: ID!
        title: String!
        color: String!
        description: String
        type: String!
        notifications: [WorkflowsStepNotificationInput!]!
        config: JSON
    }

    input WorkflowsWorkflowInput {
        id: ID!
        name: String!
        models: [String!]!
        steps: [WorkflowsStepInput!]!
    }

    enum WorkflowsReviewState {
        inProgress
        approved
        rejected
        cancelled
    }

    enum WorkflowsStepState {
        pending
        awaiting
        inReview
        approved
        rejected
        failed
    }

    enum WorkflowsAssignmentKind {
        outcome
        skip
    }

    type WorkflowsReviewStepAssignment {
        source: String!
        ruleId: String
        reason: String
        by: WorkflowsActor
    }

    type WorkflowsAssignmentEntry {
        id: ID!
        kind: WorkflowsAssignmentKind!
        userId: String
        assignedOn: DateTime!
        source: String!
        by: WorkflowsActor
        reason: String
    }

    type WorkflowsReviewStep {
        id: ID!
        title: String!
        color: String!
        description: String
        type: String!
        notifications: [WorkflowsStepNotification!]!
        config: JSON
        state: WorkflowsStepState!
        owner: WorkflowsActor
        comment: String
        pickedUserId: String
        candidateTeamIds: [String!]!
        assignmentSource: String
        assignment: WorkflowsReviewStepAssignment
        reachedOn: DateTime
        startedOn: DateTime
        finishedOn: DateTime
        "Assignment-log entries of this step, newest first (D127). Only on a single review read; skip entries need editor or reassign (D89)."
        assignments: [WorkflowsAssignmentEntry!]
    }

    type WorkflowsReviewTargetFolder {
        id: ID!
        type: String!
    }

    type WorkflowsReviewTargetAuthor {
        id: ID!
        displayName: String!
    }

    type WorkflowsReviewTargetContext {
        folder: WorkflowsReviewTargetFolder
        modelId: String!
        title: String!
        author: WorkflowsReviewTargetAuthor!
    }

    type WorkflowsReviewWorkflow {
        name: String!
        models: [String!]!
    }

    type WorkflowsReview {
        id: ID!
        workflowId: ID!
        model: String!
        targetId: ID!
        targetRevisionId: ID!
        title: String!
        isActive: Boolean!
        state: WorkflowsReviewState!
        currentStepId: String
        currentStepState: WorkflowsStepState
        currentStepType: String
        currentOwnerId: String
        currentCandidateTeamIds: [String!]!
        targetContext: WorkflowsReviewTargetContext!
        workflow: WorkflowsReviewWorkflow!
        steps: [WorkflowsReviewStep!]!
        "The requester."
        createdBy: WorkflowsActor!
        createdOn: DateTime!
        savedOn: DateTime!
        lastChangedOn: DateTime!
    }

    type WorkflowsViewerFlags {
        canStart: Boolean!
        canTakeOver: Boolean!
        canApprove: Boolean!
        canReject: Boolean!
        canCancel: Boolean!
        canReassign: Boolean!
        canRestart: Boolean!
    }

    type WorkflowsReviewWithFlags {
        review: WorkflowsReview!
        flags: WorkflowsViewerFlags!
    }

    enum WorkflowsReviewListKind {
        assignedToMe
        pool
        teamInReview
        myRequests
        failedSteps
    }

    enum WorkflowsReviewListSort {
        lastChangedOn_ASC
        lastChangedOn_DESC
    }

    input WorkflowsReviewListWhere {
        "CMS only: the model id, without the cms. prefix (R94)."
        modelId: String
        titleContains: String
        "My requests only (R91)."
        reviewState: WorkflowsReviewState
        "My requests only (R91)."
        stepState: WorkflowsStepState
    }

    input WorkflowsReviewPickInput {
        stepId: String!
        userId: String!
    }

    enum WorkflowsReviewsForDeleteAction {
        trash
        delete
    }
`;

const ROOT_TYPE_DEFS = /* GraphQL */ `
    type WorkflowsExclusion {
        userId: String!
        reason: String
        endsOn: DateTime
    }

    type WorkflowsSettings {
        exclusions: [WorkflowsExclusion!]!
    }

    type WorkflowsSettingsResponse {
        data: WorkflowsSettings
        error: WorkflowsError
    }

    input WorkflowsExclusionInput {
        userId: String!
        reason: String
        "ISO datetime in UTC."
        endsOn: String
    }

    input WorkflowsSettingsInput {
        exclusions: [WorkflowsExclusionInput!]!
    }

    type WorkflowsStepType {
        type: String!
        title: String!
        available: Boolean!
        unavailableReason: String
        "JSON schema of the step config; null when the type has no editable config."
        configSchema: JSON
    }

    type WorkflowsStepTypeListResponse {
        data: [WorkflowsStepType!]
        error: WorkflowsError
    }

    type WorkflowsQuery {
        getSettings(includeExpired: Boolean): WorkflowsSettingsResponse!
        listStepTypes: WorkflowsStepTypeListResponse!
    }

    type WorkflowsMutation {
        updateSettings(data: WorkflowsSettingsInput!): WorkflowsSettingsResponse!
    }

    extend type Query {
        workflows: WorkflowsQuery!
    }

    extend type Mutation {
        workflows: WorkflowsMutation!
    }
`;

/**
 * The `workflows` root on `/graphql` (R88) and the shared workflows types (R100). Registered only
 * when `advancedPublishingWorkflow` is licensed (`WorkflowsFeature` gates at register time), so no
 * per-request license guard is needed. Resolvers call only the shared configuration use cases
 * (R97, D132); the `editor` check lives there.
 */
class WorkflowsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(SHARED_TYPE_DEFS);
        builder.addTypeDefs(ROOT_TYPE_DEFS);

        builder.addResolver({
            path: "Query.workflows",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.workflows",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<GetSettingsArgs>({
            path: "WorkflowsQuery.getSettings",
            dependencies: [GetWorkflowSettingsForEditorUseCase],
            resolver: (getSettings: GetWorkflowSettingsForEditorUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getSettings.execute({
                        includeExpired: args.includeExpired === true
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "WorkflowsQuery.listStepTypes",
            dependencies: [ListWorkflowStepTypesUseCase],
            resolver: (listStepTypes: ListWorkflowStepTypesUseCase.Interface) => {
                return async () => {
                    const result = await listStepTypes.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<UpdateSettingsArgs>({
            path: "WorkflowsMutation.updateSettings",
            dependencies: [SaveWorkflowSettingsForEditorUseCase],
            resolver: (saveSettings: SaveWorkflowSettingsForEditorUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await saveSettings.execute(toWorkflowSettings(args.data));
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const WorkflowsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WorkflowsSchemaFactoryImpl,
    dependencies: []
});
```

`toWorkflowSettings` is a pure argument mapping (no dependency), allowed in a resolver file (R88). Trimming and date checks stay in `WorkflowSettingsValidator`.

- [ ] **Step 5: Register the factory**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import after the `WorkflowsPermissionsFeature` import:

```ts
import { WorkflowsSchemaFactory } from "~/graphql/WorkflowsSchemaFactory.js";
```

and at the end of `register`, after `CandidateReadAccessFeature.register(container);` (still inside the license gate, after Task 5's registrations):

```ts
        // GraphQL on /graphql: the `workflows` root and the shared types (R88, R100)
        container.register(WorkflowsSchemaFactory);
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/graphql 2>&1 | tail -50`
Expected: PASS (8 tests).

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` and `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (both register `WorkflowsFeature`; the `/graphql` schema they build now includes the workflows types, and `wbPageSystem.test.ts` still introspects).

- [ ] **Step 7: Type-check**

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, and restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the workflows graphql root with the shared types, settings and step types

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
