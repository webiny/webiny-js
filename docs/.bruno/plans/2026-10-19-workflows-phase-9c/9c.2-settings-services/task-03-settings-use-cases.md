### Task 3: Settings use cases and services feature

R317 (use cases always send `includeExpired: true`, envelope rule, services feature), R318 (a save sends the whole list as given), A108 (`updateSettings` returns the whole saved record), Q62; inherited R204 (envelope error to `GraphQLOperationError`, transport `Error` rethrown), R238, R243, the registration rule (every new DI feature registered in `[AW]/app.tsx` by the task that creates it and asserted in `[AW]/app.test.tsx` with the flag on and off); Review Focus 1 and 6 (`00-shared.md`). The 9c Global Constraints and everything they inherit apply unchanged (read: no wrapper helpers around dependency calls, one named import per line, no inline object types, targeted tests, the pre-commit chain).

The settings use cases sit on Task 2's gateway: `getSettings()` and `updateSettings(settings)`. The page never asks for "active only": a save replaces the whole record, so an expired entry that was not loaded would be deleted by the next save (research-api 1), hence `includeExpired: true` on every read, fixed inside the use case. Both methods map the DTOs to the domain and turn an error envelope (or one with neither data nor error) into `toOperationError(error)`; a transport `Error` passes through. One implementation serves every app, bound once (the settings root is app-neutral, so R237's subclass rule does not apply, like `WorkflowConfigUseCases`). `WorkflowSettingsServicesFeature` registers the gateway and the use cases as singletons and is registered by `WorkflowsAdminApp` inside the flag gate. The settings test kit starts here: a vitest fake of the use cases and a pure `createExclusion` builder (R243: separate files, the builder imports nothing from vitest, mobx or DI).

**Files:**
- Create: `packages/app-workflows/src/settings/useCases/IWorkflowSettingsUseCases.ts`
- Create: `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.ts`
- Create: `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCasesImpl.ts`
- Create: `packages/app-workflows/src/settings/feature.ts`
- Create: `packages/app-workflows/src/settings/testing/fakeWorkflowSettingsUseCases.ts`
- Create: `packages/app-workflows/src/settings/testing/settingsFixtures.ts`
- Modify: `packages/app-workflows/src/app.tsx`
- Create: `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCasesImpl.test.ts`
- Create: `packages/app-workflows/src/settings/feature.test.ts`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes: Task 2 (`WorkflowSettingsGateway` token and implementation, `IWorkflowSettingsGateway`, `GetSettingsParams`, `WorkflowSettingsDto`, `mapWorkflowSettings`, `toWorkflowSettingsDto`, `WorkflowExclusion`, `WorkflowSettings`, `SettingsErrorCode`). Existing (verified with codegraph and the source): `toOperationError` (`~/editor/useCases/toOperationError.js`, fallback message `The request failed.`), `GraphQLOperationError` (`@webiny/app/errors/index.js`), `createAbstraction`, `createFeature` (`@webiny/feature/admin`), `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`), `Container` (`@webiny/di`), `RegisterFeature` (`@webiny/app-admin`), the `[AW]/app.test.tsx` `mount(flagOn)` helper and its `describe` layout, the `WorkflowEditorServicesFeature` / `editor/feature.test.ts` pattern.
- Produces (matches the contract): `IWorkflowSettingsUseCases { getSettings(): Promise<WorkflowSettings>; updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> }`, the token `WorkflowSettingsUseCases` (`"Workflows/WorkflowSettingsUseCases"`, namespace `Interface`) and its implementation `WorkflowSettingsUseCasesImpl` exported as `WorkflowSettingsUseCases`, `WorkflowSettingsServicesFeature` (`"Workflows/WorkflowSettingsServices"`, resolve `{ settingsUseCases }`), `createFakeSettingsUseCases(): FakeWorkflowSettingsUseCases` (`getSettings` resolves `{ exclusions: [] }`, `updateSettings` resolves the settings it was given), `createExclusion(overrides?: Partial<WorkflowExclusion>): WorkflowExclusion` (defaults `{ userId: "user-1", reason: null, endsOn: null }`). Consumed by Tasks 4, 5 and 7-10.

**Test runner note:** admin package, `yarn test <path>` only, one file per command; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/testing/settingsFixtures.ts` (a pure builder, R243; the tests below import it):

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";

// An exclusion of `user-1` with no reason and no end date; `overrides` win.
export const createExclusion = (overrides: Partial<WorkflowExclusion> = {}): WorkflowExclusion => {
    return {
        userId: "user-1",
        reason: null,
        endsOn: null,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCasesImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/WorkflowSettingsGateway.js";
import type { WorkflowSettingsDto } from "~/settings/gateway/dto.js";
import type { WorkflowExclusionDto } from "~/settings/gateway/dto.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./WorkflowSettingsUseCases.js";
import { WorkflowSettingsUseCases } from "./WorkflowSettingsUseCasesImpl.js";

// Untyped mocks, as the config use-case test: a typed union of two mocks is not callable in `it.each`.
interface FakeGateway {
    getSettings: Mock;
    updateSettings: Mock;
}

const createFakeGateway = (): FakeGateway => {
    return {
        getSettings: vi.fn(),
        updateSettings: vi.fn()
    };
};

interface OperationCase {
    name: string;
    method: keyof FakeGateway;
    run: (useCases: UseCasesAbstraction.Interface) => Promise<unknown>;
}

const SAVED: WorkflowSettings = {
    exclusions: [createExclusion({ userId: "user-1", reason: "On leave" })]
};

const operationCases: OperationCase[] = [
    { name: "getSettings", method: "getSettings", run: useCases => useCases.getSettings() },
    {
        name: "updateSettings",
        method: "updateSettings",
        run: useCases => useCases.updateSettings(SAVED)
    }
];

describe("WorkflowSettingsUseCases (R317)", () => {
    let gateway: FakeGateway;
    let useCases: UseCasesAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeGateway();
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, gateway);
        container.register(WorkflowSettingsUseCases).inSingletonScope();
        useCases = container.resolve(UseCasesAbstraction);
    });

    it("always reads the settings with the expired entries (Review Focus 1)", async () => {
        gateway.getSettings.mockResolvedValue({ data: { exclusions: [] }, error: null });

        await useCases.getSettings();

        expect(gateway.getSettings).toHaveBeenCalledTimes(1);
        expect(gateway.getSettings).toHaveBeenCalledWith({ includeExpired: true });
    });

    it("maps the read settings, expired entries and absent values included, in the server's order", async () => {
        const withoutReason: WorkflowExclusionDto = {
            userId: "user-2",
            reason: null,
            endsOn: null
        };
        Reflect.deleteProperty(withoutReason, "reason");
        const dto: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-3", reason: "Old", endsOn: "2020-01-01T00:00:00.000Z" },
                withoutReason
            ]
        };
        gateway.getSettings.mockResolvedValue({ data: dto, error: null });

        const settings = await useCases.getSettings();

        expect(settings).toEqual({
            exclusions: [
                { userId: "user-3", reason: "Old", endsOn: "2020-01-01T00:00:00.000Z" },
                { userId: "user-2", reason: null, endsOn: null }
            ]
        });
    });

    it("sends exactly the given list, nulls kept, and returns the saved record mapped (R318, A108)", async () => {
        const settings: WorkflowSettings = {
            exclusions: [
                createExclusion({ userId: "user-1", reason: "On leave" }),
                createExclusion({ userId: "user-2", endsOn: "2020-01-01T00:00:00.000Z" })
            ]
        };
        const saved: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: null },
                { userId: "user-2", reason: null, endsOn: "2020-01-01T00:00:00.000Z" }
            ]
        };
        gateway.updateSettings.mockResolvedValue({ data: saved, error: null });

        const result = await useCases.updateSettings(settings);

        expect(gateway.updateSettings).toHaveBeenCalledTimes(1);
        expect(gateway.updateSettings).toHaveBeenCalledWith({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: null },
                { userId: "user-2", reason: null, endsOn: "2020-01-01T00:00:00.000Z" }
            ]
        });
        expect(result).toEqual(settings);
        expect(result).not.toBe(settings);
    });

    it("sends an empty list as an empty list", async () => {
        gateway.updateSettings.mockResolvedValue({ data: { exclusions: [] }, error: null });

        const result = await useCases.updateSettings({ exclusions: [] });

        expect(gateway.updateSettings).toHaveBeenCalledWith({ exclusions: [] });
        expect(result).toEqual({ exclusions: [] });
    });

    it("throws a validation error of a save with its code, message and data", async () => {
        gateway.updateSettings.mockResolvedValue({
            data: null,
            error: {
                code: SettingsErrorCode.Validation,
                message: "This user is already in the list. Edit it instead.",
                data: { userId: "user-1" }
            }
        });

        const promise = useCases.updateSettings(SAVED);

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            code: SettingsErrorCode.Validation,
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        });
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, createFakeGateway());
        container.register(WorkflowSettingsUseCases).inSingletonScope();

        expect(container.resolve(UseCasesAbstraction)).toBe(
            container.resolve(UseCasesAbstraction)
        );
    });

    describe("errors (R204)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError for an error envelope",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({
                    data: null,
                    error: {
                        code: SettingsErrorCode.NotAuthorized,
                        message: "You are not allowed to change the workflow settings.",
                        data: { action: "change the workflow settings" }
                    }
                });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: SettingsErrorCode.NotAuthorized,
                    message: "You are not allowed to change the workflow settings.",
                    data: { action: "change the workflow settings" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws when the server answers with neither data nor error",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({ data: null, error: null });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "The request failed.",
                    code: null
                });
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass as it is",
            async operationCase => {
                const failure = new Error("Network down.");
                gateway[operationCase.method].mockRejectedValue(failure);

                await expect(operationCase.run(useCases)).rejects.toBe(failure);
            }
        );
    });
});
```

Create `packages/app-workflows/src/settings/feature.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WorkflowSettingsServicesFeature } from "./feature.js";
import { WorkflowSettingsGateway } from "./gateway/WorkflowSettingsGateway.js";
import { WorkflowSettingsUseCases } from "./useCases/WorkflowSettingsUseCases.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    return container;
};

describe("WorkflowSettingsServicesFeature (R317)", () => {
    it("registers the settings gateway and the settings use cases", () => {
        const container = createContainer();
        WorkflowSettingsServicesFeature.register(container);

        expect(container.resolve(WorkflowSettingsGateway)).toBeDefined();
        expect(container.resolve(WorkflowSettingsUseCases)).toBeDefined();
    });

    it("registers them as singletons and resolves the use cases", () => {
        const container = createContainer();
        WorkflowSettingsServicesFeature.register(container);

        const first = WorkflowSettingsServicesFeature.resolve(container);
        const second = WorkflowSettingsServicesFeature.resolve(container);

        expect(first.settingsUseCases).toBe(second.settingsUseCases);
        expect(first.settingsUseCases).toBe(container.resolve(WorkflowSettingsUseCases));
        expect(container.resolve(WorkflowSettingsGateway)).toBe(
            container.resolve(WorkflowSettingsGateway)
        );
    });

    it("runs the use cases over the gateway with the expired entries", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                getSettings: {
                    data: { exclusions: [{ userId: "user-1", reason: null, endsOn: null }] },
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        WorkflowSettingsServicesFeature.register(container);
        const { settingsUseCases } = WorkflowSettingsServicesFeature.resolve(container);

        const settings = await settingsUseCases.getSettings();

        expect(settings).toEqual({
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        });
        expect(execute).toHaveBeenCalledTimes(1);
        const request = execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: true });
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`.

Before:

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
```

After:

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
```

Before:

```ts
describe("WorkflowsAdminApp workflow editor presenter", () => {
```

After:

```ts
describe("WorkflowsAdminApp workflow settings services", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the settings use cases as a singleton when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        const first = container.resolve(WorkflowSettingsUseCases);
        expect(first).toBeDefined();
        expect(first).toBe(container.resolve(WorkflowSettingsUseCases));
    });

    it("registers no settings service when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowSettingsUseCases)).toThrow();
    });
});

describe("WorkflowsAdminApp workflow editor presenter", () => {
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCasesImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
```

Expected: the first file fails to load with `Failed to resolve import "./WorkflowSettingsUseCases.js"`, the second with `Failed to resolve import "./feature.js"`, the third with `Failed to resolve import "~/settings/useCases/WorkflowSettingsUseCases.js"`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/useCases/IWorkflowSettingsUseCases.ts`:

```ts
import type { WorkflowSettings } from "~/settings/domain/types.js";

/*
 * The settings page's operations (R317). Every method throws a `GraphQLOperationError` for a
 * server error or the transport `Error` as is (R204). `getSettings` always returns the expired
 * entries too; `updateSettings` replaces the whole record and returns it as saved (D106, A108).
 */
export interface IWorkflowSettingsUseCases {
    getSettings(): Promise<WorkflowSettings>;
    updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings>;
}
```

Create `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowSettingsUseCases } from "./IWorkflowSettingsUseCases.js";

export const WorkflowSettingsUseCases = createAbstraction<IWorkflowSettingsUseCases>(
    "Workflows/WorkflowSettingsUseCases"
);

export namespace WorkflowSettingsUseCases {
    export type Interface = IWorkflowSettingsUseCases;
}
```

Create `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCasesImpl.ts`:

```ts
import { WorkflowSettingsGateway } from "~/settings/gateway/WorkflowSettingsGateway.js";
import type { GetSettingsParams } from "~/settings/gateway/IWorkflowSettingsGateway.js";
import { mapWorkflowSettings } from "~/settings/gateway/mapWorkflowSettings.js";
import { toWorkflowSettingsDto } from "~/settings/gateway/toWorkflowSettingsDto.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { toOperationError } from "~/editor/useCases/toOperationError.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./WorkflowSettingsUseCases.js";

/*
 * One implementation for every app: the settings live on the shared `workflows` root and the
 * gateway is bound once, so the class is not subclassed (R237 concerns a class bound under more
 * than one token). A read always includes the expired entries: a save replaces the whole record,
 * so an entry the page never loaded would be deleted by the next save (R317).
 */
class WorkflowSettingsUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(private gateway: WorkflowSettingsGateway.Interface) {}

    public async getSettings(): Promise<WorkflowSettings> {
        const params: GetSettingsParams = { includeExpired: true };
        const envelope = await this.gateway.getSettings(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapWorkflowSettings(envelope.data);
    }

    public async updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> {
        const data = toWorkflowSettingsDto(settings);
        const envelope = await this.gateway.updateSettings(data);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapWorkflowSettings(envelope.data);
    }
}

export const WorkflowSettingsUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowSettingsUseCasesImpl,
    dependencies: [WorkflowSettingsGateway]
});
```

Create `packages/app-workflows/src/settings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsGateway } from "./gateway/WorkflowSettingsGatewayImpl.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./useCases/WorkflowSettingsUseCases.js";
import { WorkflowSettingsUseCases } from "./useCases/WorkflowSettingsUseCasesImpl.js";

/*
 * The app-neutral settings services, registered once by `WorkflowsAdminApp` inside the feature
 * flag gate (R211, R317): the settings gateway and use cases, both singletons. User names and the
 * user search reuse the shared `WorkflowConfigUseCases.listUsers`.
 */
export const WorkflowSettingsServicesFeature = createFeature({
    name: "Workflows/WorkflowSettingsServices",
    register(container) {
        container.register(WorkflowSettingsGateway).inSingletonScope();
        container.register(WorkflowSettingsUseCases).inSingletonScope();
    },
    resolve(container) {
        return {
            settingsUseCases: container.resolve(UseCasesAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/settings/testing/fakeWorkflowSettingsUseCases.ts` (a vitest fake, a separate file from the pure builder, R243):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";

export interface FakeWorkflowSettingsUseCases extends WorkflowSettingsUseCases.Interface {
    getSettings: Mock<WorkflowSettingsUseCases.Interface["getSettings"]>;
    updateSettings: Mock<WorkflowSettingsUseCases.Interface["updateSettings"]>;
}

const echoSettings = (settings: WorkflowSettings): Promise<WorkflowSettings> => {
    return Promise.resolve(settings);
};

/*
 * Fake settings use cases: a read answers an empty list, a save answers the list it was given (as
 * the server returns the saved record, A108). Tests override either with `mockResolvedValue`.
 */
export const createFakeSettingsUseCases = (): FakeWorkflowSettingsUseCases => {
    const empty: WorkflowSettings = { exclusions: [] };
    return {
        getSettings: vi.fn().mockResolvedValue(empty),
        updateSettings: vi.fn(echoSettings)
    };
};
```

Modify `packages/app-workflows/src/app.tsx`.

Before:

```ts
import { WorkflowEditorServicesFeature } from "~/editor/feature.js";
```

After:

```ts
import { WorkflowEditorServicesFeature } from "~/editor/feature.js";
import { WorkflowSettingsServicesFeature } from "~/settings/feature.js";
```

Before:

```tsx
            <RegisterFeature feature={WorkflowEditorServicesFeature} />
```

After:

```tsx
            <RegisterFeature feature={WorkflowEditorServicesFeature} />
            <RegisterFeature feature={WorkflowSettingsServicesFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCasesImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
```

Expected: all pass, including every existing case of `app.test.tsx`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

`app.tsx` is also read by the cleanup test (its source must not match the old-code patterns; `WorkflowSettingsServicesFeature` matches none of them):

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/WorkflowSettingsGatewayImpl.test.ts 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the workflow settings use cases and services feature" -m "The settings use cases always read the expired entries, because a save replaces the whole record, and turn an error envelope into a GraphQLOperationError. WorkflowsAdminApp registers the settings services behind the feature flag. The settings test kit gets a fake of the use cases and an exclusion builder." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No conflicts with the code.** The fake's and the builder's function names are not fixed by the contract: `createFakeSettingsUseCases` / `FakeWorkflowSettingsUseCases` (as `createFakeConfigUseCases` / `FakeWorkflowConfigUseCases`) and `createExclusion` with an optional `overrides` (the contract's signature is `createExclusion(overrides: Partial<WorkflowExclusion>)`; a default `{}` keeps every call with an argument valid).
- **Namespace types in the fake:** the editor's fake types its mocks with `IWorkflowConfigUseCases`; this fake uses `WorkflowSettingsUseCases.Interface` (R238: outside the declaring file use the namespace).
- **`includeExpired` is built per call** (`const params: GetSettingsParams = { includeExpired: true }`) rather than a shared module constant, so no caller can mutate it.
- Size: small.

## Review fixes (sub-phase review)

- No changes. Checked: the `app.tsx` and `app.test.tsx` hunks apply to the current text (anchors at `app.tsx` imports and the `RegisterFeature` list, `app.test.tsx:25-26` and `:250`); the root `mount` registers `MainGraphQLClient`, so the settings gateway resolves; `app.cleanup.test.tsx` patterns do not match `WorkflowSettingsServicesFeature`; `toOperationError` falls back to `The request failed.` with `code: null`; the names Tasks 7-10 import (`createFakeSettingsUseCases`, `FakeWorkflowSettingsUseCases`, `createExclusion`, `WorkflowSettingsUseCases`) match.
