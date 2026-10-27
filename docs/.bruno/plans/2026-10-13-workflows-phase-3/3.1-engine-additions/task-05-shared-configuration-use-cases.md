### Task 5: Settings for editors and step types

Spec 4.4, 8, 10, D130, D132, D133 point 2, R87, R97, R98, R105. The settings and step types are shared by every app, so their operations live in api-workflows (3.2 puts them on the `workflows` root). GraphQL never calls an engine use case (D132), so three new use cases do the `editor` check and then call the engine inline:

- `GetWorkflowSettingsForEditorUseCase({ includeExpired? })` → `GetWorkflowSettingsUseCase`.
- `SaveWorkflowSettingsForEditorUseCase(settings)` → `SaveWorkflowSettingsUseCase` (its validation error keeps code and data).
- `ListWorkflowStepTypesUseCase()` → the static phase 3 list (R98): `review` (available, config JSON schema from zod 4 `toJSONSchema(reviewStepConfigSchema)`), `ai` (available when the `aiPowerups` feature flag is on, else "AI powerups are not enabled."), `automation` (never available before phase 5: "No automation is defined."). Phase 5 replaces the list with the `StepType` registry.

Each one: `CurrentReviewViewer.getActor()` (anonymous → `Workflows/NotAuthenticated`), then `WorkflowsPermissions.canEdit()` in an inline `try`/`catch` (a throw becomes the use case's persistence error, R87: `Workflows/Settings/Persistence` for the settings, `Workflows/Workflow/Persistence` for the step types), then `Workflows/NotAuthorized` with the R105 action: `"view the workflow settings"`, `"change the workflow settings"`, `"list the step types"`. A refusal never calls the engine.

**Files:**
- Create: `packages/api-workflows/src/domain/config/types.ts`
- Create: `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/GetWorkflowSettingsForEditorUseCase.ts`
- Create: `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/feature.ts`
- Create: `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/index.ts`
- Create: `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/SaveWorkflowSettingsForEditorUseCase.ts`
- Create: `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/feature.ts`
- Create: `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/index.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowStepTypes/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowStepTypes/ListWorkflowStepTypesUseCase.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowStepTypes/feature.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowStepTypes/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/src/features/permissions/WorkflowsPermissions/abstractions.ts` (doc comment)
- Test: `packages/api-workflows/__tests__/config/WorkflowSettingsForEditor.test.ts`
- Test: `packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

No new dependency: the AI flag is switched on in the test with a `FeatureFlags` decorator, so `@webiny/wcp` (allowed by R101) is not needed.

**Interfaces:**
- Consumes: `CurrentReviewViewer.getActor(): Result<Actor, WorkflowsNotAuthenticatedError>`, `WorkflowsPermissions.canEdit(): Promise<boolean>`, `GetWorkflowSettingsUseCase.execute(input?: { includeExpired?: boolean })` (`GetWorkflowSettingsUseCase.Error`), `SaveWorkflowSettingsUseCase.execute(input: WorkflowSettings)` (`SaveWorkflowSettingsUseCase.Error`: `Workflows/Settings/Validation` with `data: { userId }`, `Workflows/Settings/Persistence`), `FeatureFlags.get().isEnabled("aiPowerups")` (`@webiny/api-core/features/featureFlags/abstractions.js`), `reviewStepConfigSchema`, `REVIEW_STEP_TYPE`, `WorkflowsNotAuthorizedError`, `WorkflowSettingsPersistenceError`, `WorkflowPersistenceError`, `IdentityContext.withIdentity`, `AnonymousIdentity`.
- Produces (3.2 consumes these names exactly; each folder's `index.js` exports the abstraction):
  - `WorkflowStepTypeInfo { type: string; title: string; available: boolean; unavailableReason: string | null; configSchema: Record<string, unknown> | null }` in `src/domain/config/types.ts`.
  - `GetWorkflowSettingsForEditorUseCase` (`features/config/GetWorkflowSettingsForEditor/index.js`): `execute(input?: GetWorkflowSettingsForEditorInput): Promise<Result<WorkflowSettings, Error>>`, `GetWorkflowSettingsForEditorInput { includeExpired?: boolean | null }`.
  - `SaveWorkflowSettingsForEditorUseCase` (`features/config/SaveWorkflowSettingsForEditor/index.js`): `execute(input: WorkflowSettings): Promise<Result<WorkflowSettings, Error>>`.
  - `ListWorkflowStepTypesUseCase` (`features/config/ListWorkflowStepTypes/index.js`): `execute(): Promise<Result<WorkflowStepTypeInfo[], Error>>`.
  - Errors: `Workflows/NotAuthenticated`, `Workflows/NotAuthorized` (`data.action` per R105), `Workflows/Settings/Validation` (save), `Workflows/Settings/Persistence` (settings), `Workflows/Workflow/Persistence` (step types).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/config/WorkflowSettingsForEditor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowSettingsForEditorUseCase } from "~/features/config/GetWorkflowSettingsForEditor/index.js";
import { SaveWorkflowSettingsForEditorUseCase } from "~/features/config/SaveWorkflowSettingsForEditor/index.js";

const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";

/** `cms.*` is harmless: private models skip entry authorization, so only the workflows rule is tested. */
const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }, { name: "cms.*" }];
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }, { name: "cms.*" }];

interface EngineCalls {
    get: number;
    save: number;
}

const engineCalls: EngineCalls = { get: 0, save: 0 };

class CountingGetSettings implements GetWorkflowSettingsUseCase.Interface {
    constructor(private decoratee: GetWorkflowSettingsUseCase.Interface) {}

    execute(input?: GetWorkflowSettingsUseCase.Input): GetWorkflowSettingsUseCase.Return {
        engineCalls.get++;
        return this.decoratee.execute(input);
    }
}

class CountingSaveSettings implements SaveWorkflowSettingsUseCase.Interface {
    constructor(private decoratee: SaveWorkflowSettingsUseCase.Interface) {}

    execute(input: SaveWorkflowSettingsUseCase.Input): SaveWorkflowSettingsUseCase.Return {
        engineCalls.save++;
        return this.decoratee.execute(input);
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createSettingsContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerDecorator(
                GetWorkflowSettingsUseCase.createDecorator({
                    decorator: CountingGetSettings,
                    dependencies: []
                })
            );
            container.registerDecorator(
                SaveWorkflowSettingsUseCase.createDecorator({
                    decorator: CountingSaveSettings,
                    dependencies: []
                })
            );
            await params.setup?.(container);
        }
    });
    const { container } = context;
    expectOk(
        await container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                { userId: "user-b", endsOn: PAST }
            ]
        })
    );
    engineCalls.get = 0;
    engineCalls.save = 0;
    return {
        container,
        getForEditor: container.resolve(GetWorkflowSettingsForEditorUseCase),
        saveForEditor: container.resolve(SaveWorkflowSettingsForEditorUseCase)
    };
};

describe("Workflow settings for editors (D133, R97)", () => {
    it("reads the settings for an editor, with expired exclusions only when asked", async () => {
        const { getForEditor } = await createSettingsContext({ permissions: EDITOR });

        const active = expectOk(await getForEditor.execute());
        const all = expectOk(await getForEditor.execute({ includeExpired: true }));

        expect(active.exclusions.map(item => item.userId)).toEqual(["user-a"]);
        expect(all.exclusions.map(item => item.userId)).toEqual(["user-a", "user-b"]);
        expect(engineCalls.get).toBe(2);
    });

    it("saves the settings for an editor", async () => {
        const { container, saveForEditor } = await createSettingsContext({ permissions: EDITOR });

        const saved = expectOk(
            await saveForEditor.execute({ exclusions: [{ userId: "user-c", reason: "Leave" }] })
        );

        expect(saved).toEqual({ exclusions: [{ userId: "user-c", reason: "Leave" }] });
        const read = expectOk(
            await container.resolve(GetWorkflowSettingsUseCase).execute({ includeExpired: true })
        );
        expect(read).toEqual(saved);
    });

    it("returns the engine's validation error with its code and data", async () => {
        const { saveForEditor } = await createSettingsContext({ permissions: EDITOR });

        const result = await saveForEditor.execute({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", endsOn: FUTURE }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect(result.error.data).toEqual({ userId: "user-a" });
    });

    it("refuses a user without editor and does not call the engine", async () => {
        const { getForEditor, saveForEditor } = await createSettingsContext({
            permissions: REASSIGNER
        });

        const read = await getForEditor.execute();
        const saved = await saveForEditor.execute({ exclusions: [] });

        expect(read.error.code).toBe("Workflows/NotAuthorized");
        expect(read.error.data).toEqual({ action: "view the workflow settings" });
        expect(saved.error.code).toBe("Workflows/NotAuthorized");
        expect(saved.error.data).toEqual({ action: "change the workflow settings" });
        expect(engineCalls).toEqual({ get: 0, save: 0 });
    });

    it("refuses an anonymous identity and does not call the engine", async () => {
        const { container, getForEditor, saveForEditor } = await createSettingsContext();
        const identityContext = container.resolve(IdentityContext);

        const read = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            getForEditor.execute()
        );
        const saved = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            saveForEditor.execute({ exclusions: [] })
        );

        expect(read.error.code).toBe("Workflows/NotAuthenticated");
        expect(saved.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual({ get: 0, save: 0 });
    });

    it("returns the settings persistence error when the permission check throws (R87)", async () => {
        const { getForEditor, saveForEditor } = await createSettingsContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const read = await getForEditor.execute();
        const saved = await saveForEditor.execute({ exclusions: [] });

        expect(read.error.code).toBe("Workflows/Settings/Persistence");
        expect(read.error.message).toBe("Permissions are down.");
        expect(saved.error.code).toBe("Workflows/Settings/Persistence");
        expect(engineCalls).toEqual({ get: 0, save: 0 });
    });
});
```

Create `packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import zod from "zod";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";

/** Turns the `aiPowerups` flag on; every other flag answers as before. */
class AiPowerupsEnabledFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get() {
        const flags = this.decoratee.get();
        const isEnabled = flags.isEnabled.bind(flags);
        flags.isEnabled = name => name === "aiPowerups" || isEnabled(name);
        return flags;
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createStepTypesContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
    return {
        container: context.container,
        listStepTypes: context.container.resolve(ListWorkflowStepTypesUseCase)
    };
};

describe("ListWorkflowStepTypesUseCase (D130, R98)", () => {
    it("lists review, AI and automation for an editor; AI is off without the flag", async () => {
        const { listStepTypes } = await createStepTypesContext({
            permissions: [{ name: "workflows", editor: true }]
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes).toEqual([
            {
                type: "review",
                title: "Review",
                available: true,
                unavailableReason: null,
                configSchema: zod.toJSONSchema(reviewStepConfigSchema)
            },
            {
                type: "ai",
                title: "AI",
                available: false,
                unavailableReason: "AI powerups are not enabled.",
                configSchema: null
            },
            {
                type: "automation",
                title: "Automation",
                available: false,
                unavailableReason: "No automation is defined.",
                configSchema: null
            }
        ]);
        expect(stepTypes[0].configSchema).toMatchObject({
            type: "object",
            required: ["teams", "assignment"]
        });
    });

    it("marks AI available when the aiPowerups flag is on", async () => {
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: AiPowerupsEnabledFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes[1]).toEqual({
            type: "ai",
            title: "AI",
            available: true,
            unavailableReason: null,
            configSchema: null
        });
    });

    it("refuses a user without editor", async () => {
        const { listStepTypes } = await createStepTypesContext({
            permissions: [{ name: "workflows", reassign: true }]
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step types" });
    });

    it("refuses an anonymous identity", async () => {
        const { container, listStepTypes } = await createStepTypesContext();

        const result = await container
            .resolve(IdentityContext)
            .withIdentity(new AnonymousIdentity(), () => listStepTypes.execute());

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns the workflow persistence error when the permission check throws (R87)", async () => {
        const { listStepTypes } = await createStepTypesContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listStepTypes.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the imports:

```ts
import { GetWorkflowSettingsForEditorUseCase } from "~/features/config/GetWorkflowSettingsForEditor/index.js";
import { SaveWorkflowSettingsForEditorUseCase } from "~/features/config/SaveWorkflowSettingsForEditor/index.js";
import { ListWorkflowStepTypesUseCase } from "~/features/config/ListWorkflowStepTypes/index.js";
```

and after `expect(container.resolveAll(SaveWorkflowSettingsUseCase)).toHaveLength(1);` add:

```ts
        expect(container.resolveAll(GetWorkflowSettingsForEditorUseCase)).toHaveLength(1);
        expect(container.resolveAll(SaveWorkflowSettingsForEditorUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowStepTypesUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/config packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/config/GetWorkflowSettingsForEditor/index.js` (and the other two).

- [ ] **Step 3: The step type info**

Create `packages/api-workflows/src/domain/config/types.ts`:

```ts
/**
 * A step type the workflow editor can offer (D130). Static in phase 3; phase 5 builds the list
 * from the `StepType` registry.
 */
export interface WorkflowStepTypeInfo {
    /** Stored on `WorkflowStep.type`, e.g. "review". */
    type: string;
    title: string;
    /** Whether a step of this type may be added now. */
    available: boolean;
    /** Why it is unavailable; `null` when available. */
    unavailableReason: string | null;
    /** JSON schema of the step's `config`; `null` when the type has no editable config yet. */
    configSchema: Record<string, unknown> | null;
}
```

- [ ] **Step 4: Settings for editors**

Create `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";
import type { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";

export interface GetWorkflowSettingsForEditorInput {
    /** Include expired exclusions, so the settings page can edit them (D105). */
    includeExpired?: boolean | null;
}

export interface IGetWorkflowSettingsForEditorUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowSettingsPersistenceError;
    get: GetWorkflowSettingsUseCase.Error;
}

type UseCaseError =
    IGetWorkflowSettingsForEditorUseCaseErrors[keyof IGetWorkflowSettingsForEditorUseCaseErrors];

export interface IGetWorkflowSettingsForEditorUseCase {
    execute(
        input?: GetWorkflowSettingsForEditorInput
    ): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/**
 * The tenant's workflow settings for the settings page (spec 4.4, D133 point 2, R97): needs
 * `workflows.editor`. The shared `getSettings` GraphQL operation calls this, never the engine.
 */
export const GetWorkflowSettingsForEditorUseCase =
    createAbstraction<IGetWorkflowSettingsForEditorUseCase>("GetWorkflowSettingsForEditorUseCase");

export namespace GetWorkflowSettingsForEditorUseCase {
    export type Interface = IGetWorkflowSettingsForEditorUseCase;
    export type Input = GetWorkflowSettingsForEditorInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/GetWorkflowSettingsForEditorUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { GetWorkflowSettingsForEditorUseCase as UseCase } from "./abstractions.js";

class GetWorkflowSettingsForEditorUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getSettings: GetWorkflowSettingsUseCase.Interface
    ) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowSettingsPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({ action: "view the workflow settings" })
            );
        }

        return this.getSettings.execute({ includeExpired: input.includeExpired === true });
    }
}

export const GetWorkflowSettingsForEditorUseCase = UseCase.createImplementation({
    implementation: GetWorkflowSettingsForEditorUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, GetWorkflowSettingsUseCase]
});
```

Create `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWorkflowSettingsForEditorUseCase } from "./GetWorkflowSettingsForEditorUseCase.js";

export const GetWorkflowSettingsForEditorFeature = createFeature({
    name: "Workflows/GetWorkflowSettingsForEditor",
    register(container) {
        container.register(GetWorkflowSettingsForEditorUseCase);
    }
});
```

Create `packages/api-workflows/src/features/config/GetWorkflowSettingsForEditor/index.ts`:

```ts
export { GetWorkflowSettingsForEditorUseCase } from "./abstractions.js";
export type { GetWorkflowSettingsForEditorInput } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";
import type { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";

export interface ISaveWorkflowSettingsForEditorUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowSettingsPersistenceError;
    save: SaveWorkflowSettingsUseCase.Error;
}

type UseCaseError =
    ISaveWorkflowSettingsForEditorUseCaseErrors[keyof ISaveWorkflowSettingsForEditorUseCaseErrors];

export interface ISaveWorkflowSettingsForEditorUseCase {
    execute(input: WorkflowSettings): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/**
 * Save the whole settings record, last save wins (spec 4.4, D106, D133 point 2, R97): needs
 * `workflows.editor`. The shared `updateSettings` GraphQL operation calls this.
 */
export const SaveWorkflowSettingsForEditorUseCase =
    createAbstraction<ISaveWorkflowSettingsForEditorUseCase>(
        "SaveWorkflowSettingsForEditorUseCase"
    );

export namespace SaveWorkflowSettingsForEditorUseCase {
    export type Interface = ISaveWorkflowSettingsForEditorUseCase;
    export type Input = WorkflowSettings;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/SaveWorkflowSettingsForEditorUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";
import { SaveWorkflowSettingsForEditorUseCase as UseCase } from "./abstractions.js";

class SaveWorkflowSettingsForEditorUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private saveSettings: SaveWorkflowSettingsUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowSettingsPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({ action: "change the workflow settings" })
            );
        }

        return this.saveSettings.execute(input);
    }
}

export const SaveWorkflowSettingsForEditorUseCase = UseCase.createImplementation({
    implementation: SaveWorkflowSettingsForEditorUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, SaveWorkflowSettingsUseCase]
});
```

Create `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { SaveWorkflowSettingsForEditorUseCase } from "./SaveWorkflowSettingsForEditorUseCase.js";

export const SaveWorkflowSettingsForEditorFeature = createFeature({
    name: "Workflows/SaveWorkflowSettingsForEditor",
    register(container) {
        container.register(SaveWorkflowSettingsForEditorUseCase);
    }
});
```

Create `packages/api-workflows/src/features/config/SaveWorkflowSettingsForEditor/index.ts`:

```ts
export { SaveWorkflowSettingsForEditorUseCase } from "./abstractions.js";
```

- [ ] **Step 5: Step types**

Create `packages/api-workflows/src/features/config/ListWorkflowStepTypes/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowStepTypeInfo } from "~/domain/config/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListWorkflowStepTypesUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListWorkflowStepTypesUseCaseErrors[keyof IListWorkflowStepTypesUseCaseErrors];

export interface IListWorkflowStepTypesUseCase {
    execute(): Promise<Result<WorkflowStepTypeInfo[], UseCaseError>>;
}

/**
 * The step types the workflow editor offers, with availability (D130, D133 point 2, R98): needs
 * `workflows.editor`. A static list until phase 5 adds the `StepType` registry; the workflow
 * validator still accepts only "review".
 */
export const ListWorkflowStepTypesUseCase = createAbstraction<IListWorkflowStepTypesUseCase>(
    "ListWorkflowStepTypesUseCase"
);

export namespace ListWorkflowStepTypesUseCase {
    export type Interface = IListWorkflowStepTypesUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowStepTypeInfo[], UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/config/ListWorkflowStepTypes/ListWorkflowStepTypesUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import zod from "zod";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/WorkflowValidator.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowStepTypesUseCase as UseCase } from "./abstractions.js";

class ListWorkflowStepTypesUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private featureFlags: FeatureFlags.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list the step types" }));
        }

        // AI steps need the AI powerups entitlement (D130).
        const aiAvailable = this.featureFlags.get().isEnabled("aiPowerups");
        return Result.ok([
            {
                type: REVIEW_STEP_TYPE,
                title: "Review",
                available: true,
                unavailableReason: null,
                configSchema: zod.toJSONSchema(reviewStepConfigSchema)
            },
            {
                type: "ai",
                title: "AI",
                available: aiAvailable,
                unavailableReason: aiAvailable ? null : "AI powerups are not enabled.",
                configSchema: null
            },
            {
                // Needs an automation definition covering the model; none exist before phase 5.
                type: "automation",
                title: "Automation",
                available: false,
                unavailableReason: "No automation is defined.",
                configSchema: null
            }
        ]);
    }
}

export const ListWorkflowStepTypesUseCase = UseCase.createImplementation({
    implementation: ListWorkflowStepTypesUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, FeatureFlags]
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowStepTypes/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWorkflowStepTypesUseCase } from "./ListWorkflowStepTypesUseCase.js";

export const ListWorkflowStepTypesFeature = createFeature({
    name: "Workflows/ListWorkflowStepTypes",
    register(container) {
        container.register(ListWorkflowStepTypesUseCase);
    }
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowStepTypes/index.ts`:

```ts
export { ListWorkflowStepTypesUseCase } from "./abstractions.js";
export type { WorkflowStepTypeInfo } from "~/domain/config/types.js";
```

- [ ] **Step 6: Register**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports:

```ts
import { GetWorkflowSettingsForEditorFeature } from "~/features/config/GetWorkflowSettingsForEditor/feature.js";
import { SaveWorkflowSettingsForEditorFeature } from "~/features/config/SaveWorkflowSettingsForEditor/feature.js";
import { ListWorkflowStepTypesFeature } from "~/features/config/ListWorkflowStepTypes/feature.js";
```

and replace:

```ts
        SaveWorkflowSettingsFeature.register(container);
```

with:

```ts
        SaveWorkflowSettingsFeature.register(container);

        // Shared configuration operations behind `editor` (D133 point 2, R97)
        GetWorkflowSettingsForEditorFeature.register(container);
        SaveWorkflowSettingsForEditorFeature.register(container);
        ListWorkflowStepTypesFeature.register(container);
```

In `packages/api-workflows/src/features/permissions/WorkflowsPermissions/abstractions.ts`, replace:

```ts
 * app wrappers (D132): the api-workflows use cases never call it, they are an internal engine.
```

with:

```ts
 * app wrappers (D132). The api-workflows engine use cases never call it; only the app wrappers
 * and the shared configuration use cases (R97) do.
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): add the editor settings and step type use cases

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
