### Task 11: Workflow settings model and use cases

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Create: `packages/api-workflows/src/domain/settings/types.ts`
- Create: `packages/api-workflows/src/domain/settings/errors.ts`
- Create: `packages/api-workflows/src/domain/settings/settings.model.ts`
- Create: `packages/api-workflows/src/domain/settings/WorkflowSettingsValidator.ts`
- Create: `packages/api-workflows/src/domain/settings/filterActiveExclusions.ts`
- Create: `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsModelProvider.ts`
- Create: `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsRepository.ts`
- Create: `packages/api-workflows/src/features/settings/shared/WorkflowSettingsEntryMapper.ts`
- Create: `packages/api-workflows/src/features/settings/shared/WorkflowSettingsModelProvider.ts`
- Create: `packages/api-workflows/src/features/settings/shared/WorkflowSettingsRepository.ts`
- Create: `packages/api-workflows/src/features/settings/shared/feature.ts`
- Create: `packages/api-workflows/src/features/settings/GetWorkflowSettings/{abstractions.ts,GetWorkflowSettingsUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/settings/SaveWorkflowSettings/{abstractions.ts,SaveWorkflowSettingsUseCase.ts,feature.ts,index.ts}`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (every 1a abstraction registered once, D18)
- Create: `packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts`
- Create: `packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts`

**Interfaces:**
- Consumes: `toIsoString` (Task 6), CMS entry use cases, `GetModelUseCase`, `ModelFactory`, `createIdentifier` (`@webiny/utils`).
- Produces:
  - `WORKFLOW_SETTINGS_MODEL_ID = "wbyWorkflowSettings"`, `WORKFLOW_SETTINGS_ENTRY_ID = "settings"` (one entry per tenant; CMS entries are tenant-scoped).
  - `WorkflowExclusion { userId: string; reason?: string; endsOn?: string }`, `WorkflowSettings { exclusions: WorkflowExclusion[] }`.
  - `WorkflowSettingsValidator.validate(settings: WorkflowSettings): Result<WorkflowSettings, WorkflowSettingsValidationError>`; `filterActiveExclusions(exclusions: WorkflowExclusion[], now: Date): WorkflowExclusion[]`.
  - `WorkflowSettingsValidationError` (`Workflows/Settings/Validation`, data `{ userId }`), `WorkflowSettingsPersistenceError` (`Workflows/Settings/Persistence`).
  - `GetWorkflowSettingsUseCase.execute(input?: { includeExpired?: boolean })`, `SaveWorkflowSettingsUseCase.execute(input: WorkflowSettings)`; both return `Promise<Result<WorkflowSettings, …>>`. No `editor` check in 1a (phase 1b). Both `index.ts` files export the settings types (`WorkflowSettings`, `WorkflowExclusion`).
  - Tenant isolation relies on CMS entry tenancy (the entry id `settings` repeats per tenant). `createCmsTestHandler` seeds only the root tenant and `getContext()` always sends `x-tenant: root`, so 1a has no tenant-isolation test.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WorkflowSettingsValidator } from "~/domain/settings/WorkflowSettingsValidator.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";

describe("WorkflowSettingsValidator", () => {
    it("normalizes end dates to UTC, trims reasons and drops empty optionals", () => {
        const result = WorkflowSettingsValidator.validate({
            exclusions: [
                { userId: "user-a", reason: " On leave ", endsOn: "2026-10-09T23:59:59+02:00" },
                { userId: "user-b", reason: "   " }
            ]
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: "2026-10-09T21:59:59.000Z" },
                { userId: "user-b" }
            ]
        });
    });

    it("rejects a second entry for the same user", () => {
        const result = WorkflowSettingsValidator.validate({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", reason: "Again" }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect(result.error.message).toBe("This user is already in the list. Edit it instead.");
        expect(result.error.data).toEqual({ userId: "user-a" });
    });

    it("rejects an entry without a user or with an invalid end date", () => {
        const noUser = WorkflowSettingsValidator.validate({ exclusions: [{ userId: " " }] });
        const badDate = WorkflowSettingsValidator.validate({
            exclusions: [{ userId: "user-a", endsOn: "next week" }]
        });

        expect(noUser.error.message).toBe("Every exclusion needs a user.");
        expect(badDate.error.message).toBe('The end date "next week" is not a valid date.');
    });
});

describe("filterActiveExclusions", () => {
    it("keeps entries without an end date and entries that end later", () => {
        const now = new Date("2026-10-09T10:00:00.000Z");

        const active = filterActiveExclusions(
            [
                { userId: "user-a" },
                { userId: "user-b", endsOn: "2026-10-09T09:59:59.000Z" },
                { userId: "user-c", endsOn: "2026-10-09T10:00:00.001Z" }
            ],
            now
        );

        expect(active.map(exclusion => exclusion.userId)).toEqual(["user-a", "user-c"]);
    });
});
```

Create `packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";

const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";

const createUseCases = async () => {
    const { context } = await createContextHandler();
    return {
        getSettings: context.container.resolve(GetWorkflowSettingsUseCase),
        saveSettings: context.container.resolve(SaveWorkflowSettingsUseCase)
    };
};

describe("Workflow settings use cases", () => {
    it("returns no exclusions before anything is saved", async () => {
        const { getSettings } = await createUseCases();

        const result = await getSettings.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ exclusions: [] });
    });

    it("saves exclusions and hides expired ones unless asked", async () => {
        const { getSettings, saveSettings } = await createUseCases();

        const saved = await saveSettings.execute({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                { userId: "user-b", endsOn: PAST },
                { userId: "user-c" }
            ]
        });
        expect(saved.isOk()).toBe(true);

        const active = await getSettings.execute();
        expect(active.value.exclusions).toEqual([
            { userId: "user-a", reason: "On leave", endsOn: FUTURE },
            { userId: "user-c" }
        ]);

        const all = await getSettings.execute({ includeExpired: true });
        expect(all.value.exclusions.map(exclusion => exclusion.userId)).toEqual([
            "user-a",
            "user-b",
            "user-c"
        ]);
    });

    it("rejects a second entry for the same user and keeps the stored record", async () => {
        const { saveSettings, getSettings } = await createUseCases();
        const stored = { exclusions: [{ userId: "user-z", reason: "Parental leave" }] };
        expectOk(await saveSettings.execute(stored));

        const result = await saveSettings.execute({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", endsOn: FUTURE }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect(expectOk(await getSettings.execute({ includeExpired: true }))).toEqual(stored);
    });

    it("lets the last save win", async () => {
        const { getSettings, saveSettings } = await createUseCases();
        expectOk(await saveSettings.execute({ exclusions: [{ userId: "user-a" }] }));

        expectOk(
            await saveSettings.execute({ exclusions: [{ userId: "user-b", reason: "Training" }] })
        );

        const result = expectOk(await getSettings.execute({ includeExpired: true }));
        expect(result).toEqual({ exclusions: [{ userId: "user-b", reason: "Training" }] });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/settings/WorkflowSettingsValidator.js`.

- [ ] **Step 3: Add the settings domain**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const REVIEW_MODEL_ID = "wbyWorkflowReview";
export const ASSIGNMENT_MODEL_ID = "wbyWorkflowAssignment";
export const WORKFLOW_SETTINGS_MODEL_ID = "wbyWorkflowSettings";
/** The one settings entry of a tenant (CMS entries are tenant-scoped). */
export const WORKFLOW_SETTINGS_ENTRY_ID = "settings";
export const WORKFLOWS_PERMISSION = "workflows";
```

Create `packages/api-workflows/src/domain/settings/types.ts`:

```ts
export interface WorkflowExclusion {
    userId: string;
    reason?: string;
    /** ISO datetime in UTC (D43, D110). */
    endsOn?: string;
}

/** Tenant workflow settings (spec 4.4, D16). */
export interface WorkflowSettings {
    exclusions: WorkflowExclusion[];
}
```

Create `packages/api-workflows/src/domain/settings/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";

export interface WorkflowSettingsValidationErrorData {
    userId: string;
}

export class WorkflowSettingsValidationError extends BaseError<WorkflowSettingsValidationErrorData> {
    override readonly code = "Workflows/Settings/Validation" as const;

    constructor(message: string, data: WorkflowSettingsValidationErrorData) {
        super({ message, data });
    }
}

export interface WorkflowSettingsPersistenceErrorCause {
    code?: string;
    message: string;
}

export interface WorkflowSettingsPersistenceErrorData {
    cause: WorkflowSettingsPersistenceErrorCause;
}

export class WorkflowSettingsPersistenceError extends BaseError<WorkflowSettingsPersistenceErrorData> {
    override readonly code = "Workflows/Settings/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}
```

Create `packages/api-workflows/src/domain/settings/WorkflowSettingsValidator.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowSettingsValidationError } from "./errors.js";
import type { WorkflowExclusion, WorkflowSettings } from "./types.js";

const fail = (message: string, userId: string) => {
    return Result.fail(new WorkflowSettingsValidationError(message, { userId }));
};

/** One entry per user (D105); end dates are stored as UTC instants (D43, D110). */
export class WorkflowSettingsValidator {
    public static validate(
        settings: WorkflowSettings
    ): Result<WorkflowSettings, WorkflowSettingsValidationError> {
        const userIds = new Set<string>();
        const exclusions: WorkflowExclusion[] = [];

        for (const exclusion of settings.exclusions) {
            const userId = (exclusion.userId ?? "").trim();
            if (!userId) {
                return fail("Every exclusion needs a user.", "");
            }
            if (userIds.has(userId)) {
                return fail("This user is already in the list. Edit it instead.", userId);
            }
            userIds.add(userId);

            let endsOn: string | undefined;
            if (exclusion.endsOn) {
                const time = Date.parse(exclusion.endsOn);
                if (Number.isNaN(time)) {
                    return fail(`The end date "${exclusion.endsOn}" is not a valid date.`, userId);
                }
                endsOn = new Date(time).toISOString();
            }

            const reason = exclusion.reason?.trim();
            exclusions.push({
                userId,
                ...(reason ? { reason } : {}),
                ...(endsOn ? { endsOn } : {})
            });
        }

        return Result.ok({ exclusions });
    }
}
```

Create `packages/api-workflows/src/domain/settings/filterActiveExclusions.ts`:

```ts
import type { WorkflowExclusion } from "./types.js";

/** Expired entries stay stored until removed (D105) but are filtered on read (spec 4.4). */
export const filterActiveExclusions = (
    exclusions: WorkflowExclusion[],
    now: Date
): WorkflowExclusion[] => {
    return exclusions.filter(exclusion => {
        return !exclusion.endsOn || Date.parse(exclusion.endsOn) > now.getTime();
    });
};
```

Create `packages/api-workflows/src/domain/settings/settings.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_SETTINGS_MODEL_ID } from "~/constants.js";

/** Private model for tenant workflow settings (spec 4.4); one entry per tenant. */
class WorkflowSettingsModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WORKFLOW_SETTINGS_MODEL_ID,
                    name: "Workflow Settings"
                })
                .fields(fields => ({
                    exclusions: fields
                        .object()
                        .label("Exclusions")
                        .list()
                        .fields(exclusionFields => ({
                            userId: exclusionFields.text().label("User ID"),
                            reason: exclusionFields.longText().label("Reason"),
                            endsOn: exclusionFields.datetime().label("Ends on").withoutTimezone()
                        }))
                }))
        ];
    }
}

export const WorkflowSettingsModel = ModelFactory.createImplementation({
    implementation: WorkflowSettingsModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowSettingsModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowSettings` model on demand. */
export const WorkflowSettingsModelProvider = createAbstraction<IWorkflowSettingsModelProvider>(
    "WorkflowSettingsModelProvider"
);

export namespace WorkflowSettingsModelProvider {
    export type Interface = IWorkflowSettingsModelProvider;
}
```

Create `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "../types.js";
import type { WorkflowSettingsPersistenceError } from "../errors.js";

export interface IWorkflowSettingsRepository {
    /** Stored settings, including expired exclusions; empty when nothing was saved yet. */
    get(): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>>;
    /** Writes the whole record; the last save wins (D106). */
    save(settings: WorkflowSettings): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>>;
}

export const WorkflowSettingsRepository = createAbstraction<IWorkflowSettingsRepository>(
    "WorkflowSettingsRepository"
);

export namespace WorkflowSettingsRepository {
    export type Interface = IWorkflowSettingsRepository;
}
```

- [ ] **Step 4: Add the mapper, provider, repository and shared feature**

Create `packages/api-workflows/src/features/settings/shared/WorkflowSettingsEntryMapper.ts`:

```ts
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";

export interface WorkflowSettingsEntryExclusion {
    userId: string;
    reason: string | null;
    endsOn: string | Date | null;
}

export interface WorkflowSettingsEntryValues {
    exclusions: WorkflowSettingsEntryExclusion[] | null;
}

export class WorkflowSettingsEntryMapper {
    public static toValues(settings: WorkflowSettings): WorkflowSettingsEntryValues {
        return {
            exclusions: settings.exclusions.map(exclusion => ({
                userId: exclusion.userId,
                reason: exclusion.reason ?? null,
                endsOn: exclusion.endsOn ?? null
            }))
        };
    }

    public static fromEntry(entry: CmsEntry<WorkflowSettingsEntryValues>): WorkflowSettings {
        return {
            exclusions: (entry.values.exclusions ?? []).map(exclusion =>
                WorkflowSettingsEntryMapper.exclusionFromEntry(exclusion)
            )
        };
    }

    private static exclusionFromEntry(value: WorkflowSettingsEntryExclusion): WorkflowExclusion {
        const endsOn = toIsoString(value.endsOn);
        return {
            userId: value.userId,
            ...(value.reason ? { reason: value.reason } : {}),
            ...(endsOn ? { endsOn } : {})
        };
    }
}
```

Create `packages/api-workflows/src/features/settings/shared/WorkflowSettingsModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowSettingsModelProvider as Abstraction } from "~/domain/settings/abstractions/WorkflowSettingsModelProvider.js";
import { WORKFLOW_SETTINGS_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class WorkflowSettingsModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_SETTINGS_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowSettingsModelProvider = Abstraction.createImplementation({
    implementation: WorkflowSettingsModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/settings/shared/WorkflowSettingsRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { WorkflowSettingsModelProvider } from "~/domain/settings/abstractions/WorkflowSettingsModelProvider.js";
import { WorkflowSettingsRepository as Abstraction } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import { WORKFLOW_SETTINGS_ENTRY_ID } from "~/constants.js";
import {
    WorkflowSettingsEntryMapper,
    type WorkflowSettingsEntryValues
} from "./WorkflowSettingsEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
const SETTINGS_REVISION_ID = createIdentifier({ id: WORKFLOW_SETTINGS_ENTRY_ID, version: 1 });

class WorkflowSettingsRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: WorkflowSettingsModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async get(): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<WorkflowSettingsEntryValues>(
            model,
            SETTINGS_REVISION_ID
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.ok({ exclusions: [] });
            }
            return Result.fail(new WorkflowSettingsPersistenceError(result.error));
        }
        return Result.ok(WorkflowSettingsEntryMapper.fromEntry(result.value));
    }

    async save(
        settings: WorkflowSettings
    ): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>> {
        const model = await this.modelProvider.get();
        const values = WorkflowSettingsEntryMapper.toValues(settings);

        const existing = await this.getEntryById.execute<WorkflowSettingsEntryValues>(
            model,
            SETTINGS_REVISION_ID
        );
        if (existing.isFail() && existing.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new WorkflowSettingsPersistenceError(existing.error));
        }

        if (existing.isOk()) {
            const updated = await this.updateEntry.execute<WorkflowSettingsEntryValues>(
                model,
                SETTINGS_REVISION_ID,
                { values }
            );
            if (updated.isFail()) {
                return Result.fail(new WorkflowSettingsPersistenceError(updated.error));
            }
            return Result.ok(WorkflowSettingsEntryMapper.fromEntry(updated.value));
        }

        // Two concurrent first saves of a tenant can both reach this point; the second create fails
        // with Persistence (duplicate id) instead of winning (D106). Accepted: settings are edited
        // rarely, by editors, and a retry succeeds as an update.
        const created = await this.createEntry.execute<WorkflowSettingsEntryValues>(model, {
            id: WORKFLOW_SETTINGS_ENTRY_ID,
            values
        });
        if (created.isFail()) {
            return Result.fail(new WorkflowSettingsPersistenceError(created.error));
        }
        return Result.ok(WorkflowSettingsEntryMapper.fromEntry(created.value));
    }
}

export const WorkflowSettingsRepository = Abstraction.createImplementation({
    implementation: WorkflowSettingsRepositoryImpl,
    dependencies: [
        WorkflowSettingsModelProvider,
        GetEntryByIdUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
```

Create `packages/api-workflows/src/features/settings/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowSettingsModelProvider } from "./WorkflowSettingsModelProvider.js";
import { WorkflowSettingsRepository } from "./WorkflowSettingsRepository.js";

export const WorkflowSettingsSharedFeature = createFeature({
    name: "Workflows/WorkflowSettingsShared",
    register(container) {
        container.register(WorkflowSettingsModelProvider);
        container.register(WorkflowSettingsRepository).inSingletonScope();
    }
});
```

- [ ] **Step 5: Add `GetWorkflowSettings`**

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";

export interface GetWorkflowSettingsInput {
    /** Include expired exclusions. The settings page needs them so they can be edited (D105). */
    includeExpired?: boolean;
}

export interface IGetWorkflowSettingsUseCaseErrors {
    persistence: WorkflowSettingsPersistenceError;
}

type UseCaseError = IGetWorkflowSettingsUseCaseErrors[keyof IGetWorkflowSettingsUseCaseErrors];

export interface IGetWorkflowSettingsUseCase {
    execute(input?: GetWorkflowSettingsInput): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/** Read the tenant's workflow settings. No `editor` check in 1a (phase 1b). */
export const GetWorkflowSettingsUseCase = createAbstraction<IGetWorkflowSettingsUseCase>(
    "GetWorkflowSettingsUseCase"
);

export namespace GetWorkflowSettingsUseCase {
    export type Interface = IGetWorkflowSettingsUseCase;
    export type Input = GetWorkflowSettingsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/GetWorkflowSettingsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowSettingsRepository } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";
import { GetWorkflowSettingsUseCase as UseCase } from "./abstractions.js";

class GetWorkflowSettingsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const result = await this.repository.get();
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        if (input.includeExpired) {
            return Result.ok(result.value);
        }
        return Result.ok({
            exclusions: filterActiveExclusions(result.value.exclusions, new Date())
        });
    }
}

export const GetWorkflowSettingsUseCase = UseCase.createImplementation({
    implementation: GetWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
```

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWorkflowSettingsUseCase } from "./GetWorkflowSettingsUseCase.js";

export const GetWorkflowSettingsFeature = createFeature({
    name: "Workflows/GetWorkflowSettings",
    register(container) {
        container.register(GetWorkflowSettingsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/index.ts`:

```ts
export { GetWorkflowSettingsUseCase } from "./abstractions.js";
export type { GetWorkflowSettingsInput } from "./abstractions.js";
export type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";
```

- [ ] **Step 6: Add `SaveWorkflowSettings`**

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type {
    WorkflowSettingsPersistenceError,
    WorkflowSettingsValidationError
} from "~/domain/settings/errors.js";

export interface ISaveWorkflowSettingsUseCaseErrors {
    validation: WorkflowSettingsValidationError;
    persistence: WorkflowSettingsPersistenceError;
}

type UseCaseError = ISaveWorkflowSettingsUseCaseErrors[keyof ISaveWorkflowSettingsUseCaseErrors];

export interface ISaveWorkflowSettingsUseCase {
    execute(input: WorkflowSettings): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/** Save the whole settings record; last save wins (D106). No `editor` check in 1a (phase 1b). */
export const SaveWorkflowSettingsUseCase = createAbstraction<ISaveWorkflowSettingsUseCase>(
    "SaveWorkflowSettingsUseCase"
);

export namespace SaveWorkflowSettingsUseCase {
    export type Interface = ISaveWorkflowSettingsUseCase;
    export type Input = WorkflowSettings;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/SaveWorkflowSettingsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowSettingsRepository } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { WorkflowSettingsValidator } from "~/domain/settings/WorkflowSettingsValidator.js";
import { SaveWorkflowSettingsUseCase as UseCase } from "./abstractions.js";

class SaveWorkflowSettingsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const validation = WorkflowSettingsValidator.validate(input);
        if (validation.isFail()) {
            return Result.fail(validation.error);
        }
        return this.repository.save(validation.value);
    }
}

export const SaveWorkflowSettingsUseCase = UseCase.createImplementation({
    implementation: SaveWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
```

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { SaveWorkflowSettingsUseCase } from "./SaveWorkflowSettingsUseCase.js";

export const SaveWorkflowSettingsFeature = createFeature({
    name: "Workflows/SaveWorkflowSettings",
    register(container) {
        container.register(SaveWorkflowSettingsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/index.ts`:

```ts
export { SaveWorkflowSettingsUseCase } from "./abstractions.js";
export type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";
```

- [ ] **Step 7: Register settings (final `WorkflowsFeature`)**

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ReviewModel } from "~/domain/review/review.model.js";
import { AssignmentModel } from "~/domain/assignment/assignment.model.js";
import { WorkflowSettingsModel } from "~/domain/settings/settings.model.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { ReviewSharedFeature } from "~/features/review/shared/feature.js";
import { ReviewLifecycleFeature } from "~/features/review/ReviewLifecycleFeature.js";
import { RequestReviewFeature } from "~/features/review/RequestReview/feature.js";
import { GetReviewFeature } from "~/features/review/GetReview/feature.js";
import { StartReviewStepFeature } from "~/features/review/StartReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "~/features/review/TakeOverReviewStep/feature.js";
import { ApproveReviewStepFeature } from "~/features/review/ApproveReviewStep/feature.js";
import { RejectReviewStepFeature } from "~/features/review/RejectReviewStep/feature.js";
import { CancelReviewFeature } from "~/features/review/CancelReview/feature.js";
import { AssignmentSharedFeature } from "~/features/assignment/shared/feature.js";
import { WorkflowSettingsSharedFeature } from "~/features/settings/shared/feature.js";
import { GetWorkflowSettingsFeature } from "~/features/settings/GetWorkflowSettings/feature.js";
import { SaveWorkflowSettingsFeature } from "~/features/settings/SaveWorkflowSettings/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);
        container.register(ReviewModel);
        container.register(AssignmentModel);
        container.register(WorkflowSettingsModel);

        // Notifications (unchanged until phase 7)
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);

        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);

        // Assignment log (written from phase 4)
        AssignmentSharedFeature.register(container);

        // Settings
        WorkflowSettingsSharedFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        SaveWorkflowSettingsFeature.register(container);
    }
});
```

Replace `packages/api-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers every workflows abstraction once (D18)", async () => {
        const { context } = await createContextHandler();
        const { container } = context;

        expect(container.resolveAll(GetWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowsUseCase)).toHaveLength(1);
        expect(container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(DeleteWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(RequestReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(StartReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(TakeOverReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(ApproveReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(RejectReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(CancelReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(ReviewSaver)).toHaveLength(1);
        expect(container.resolveAll(ReviewStepReacher)).toHaveLength(1);
        // No default sync: phase 2 registers one per namespace.
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(0);
        expect(container.resolveAll(StepAssignmentResolver)).toHaveLength(1);
        expect(container.resolveAll(ReviewRepository)).toHaveLength(1);
        expect(container.resolveAll(AssignmentRepository)).toHaveLength(1);
        expect(container.resolveAll(GetWorkflowSettingsUseCase)).toHaveLength(1);
        expect(container.resolveAll(SaveWorkflowSettingsUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
```

- [ ] **Step 8: Run every suite**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts 2>&1 | tail -50`
Expected: PASS (8 tests).
Run: `yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS (2 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50` and `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` and `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` and `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-website-builder-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-event-handler-core 2>&1 | tail -30`
Expected: all succeed.

- [ ] **Step 9: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "feat(api-workflows): add workflow settings with exclusion list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---

