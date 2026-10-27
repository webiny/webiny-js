### Task 1: Error helper and settings data layer

R342, R343, R344, R345, R346, R351 (settings part), R354, R355, R356, R358, R360; Q71, Q72, Q74, Q76; 9c R317 (the read always asks for expired entries); 8a R202, R204 (refined here by R346), R238, R243; Review Focus 1, 6 (`00-shared.md`). The Global Constraints of this plan apply, and with them those of 9c, 9b, 9a, 8b and 8a: one class or one public function per file, one named import per line, no inline object types, no nested call arguments, namespace types (`Foo.Interface`), comments end with a period, targeted tests by path, the pre-commit chain, the two commit trailer lines.

The settings area moves to presenter → use case → repository → gateway. The shared error helper moves out of the editor folder to `[AW]/gateway/`, because from now on only area gateways call it. The settings gateway stops returning envelopes: it throws. A new `WorkflowSettingsRepository` maps DTO ↔ domain. Two thin use cases, `GetWorkflowSettingsUseCase` and `UpdateWorkflowSettingsUseCase`, replace the two bundle methods. The old bundle class stays registered as a temporary delegate (the bridge), so the three settings presenters keep working until Task 2 migrates them.

- **`toOperationError`** moves from `[AWE]/useCases/toOperationError.ts` to `[AW]/gateway/toOperationError.ts` with its test (`git mv`, so history follows). The code does not change (R346). Only the comment changes, to say that an area gateway throws the error. Its importers `WorkflowEditorUseCases.ts` and `WorkflowConfigUseCases.ts` import it from `~/gateway/toOperationError.js`. The third importer, `WorkflowSettingsUseCases.ts`, becomes the bridge and no longer needs it.
- **`IWorkflowSettingsGateway`** (`[AWS]/gateway/IWorkflowSettingsGateway.ts`, keeps its own interface file, R345): `getSettings(params: GetSettingsParams): Promise<WorkflowSettingsDto>`, `updateSettings(data: WorkflowSettingsDto): Promise<WorkflowSettingsDto>`. The comment states the R346 contract. `GetSettingsParams` stays in this file.
- **`WorkflowSettingsGateway`** (`[AWS]/gateway/WorkflowSettingsGateway.ts`): the same documents and variables as today, then `if (envelope.error || !envelope.data) { throw toOperationError(envelope.error); }` and `return envelope.data`. A transport rejection passes as it is. The token stays `Workflows/WorkflowSettingsGateway`.
- **`WorkflowSettingsRepository`** (new `[AWS]/repository/`): `abstractions.ts` declares `IWorkflowSettingsRepository { getSettings(params: GetSettingsParams): Promise<WorkflowSettings>; updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> }` and the token `Workflows/WorkflowSettingsRepository`. `WorkflowSettingsRepository.ts` (deps `[WorkflowSettingsGateway]`) maps with `mapWorkflowSettings` and, before a save, `toWorkflowSettingsDto` (R351). It does not cache and never catches. `feature.ts` exports `WorkflowSettingsRepositoryFeature` (name `Workflows/WorkflowSettingsRepository`, no `resolve`), which registers the gateway and the repository as singletons (the Dashboard precedent).
- **`GetWorkflowSettingsUseCase`** (`[AWS]/useCases/getWorkflowSettings/`): `execute(): Promise<WorkflowSettings>` calls `repository.getSettings({ includeExpired: true })`. The use case holds this R317 rule (R351). There are no params, so the namespace declares only `Interface`.
- **`UpdateWorkflowSettingsUseCase`** (`[AWS]/useCases/updateWorkflowSettings/`): `execute(params: WorkflowSettings): Promise<WorkflowSettings>` calls `repository.updateSettings(params)`. `Params = WorkflowSettings` (R348 row 2).
- **Per-operation features** (R344): `GetWorkflowSettingsFeature` (`Workflows/GetWorkflowSettings`) and `UpdateWorkflowSettingsFeature` (`Workflows/UpdateWorkflowSettings`) register their use case transient and resolve `{ useCase }`.
- **`WorkflowSettingsServicesFeature`** (`[AWS]/feature.ts`, R354): registers `WorkflowSettingsRepositoryFeature`, both use-case features and the bridge. It has no `resolve` any more. Its only `resolve` caller is `[AWS]/feature.test.ts`, which this task rewrites. `RegisterFeature` only registers.
- **Bridge (R356):** `WorkflowSettingsUseCases.ts` keeps its token, interface and singleton registration. Its class now delegates: deps `[GetWorkflowSettingsUseCase, UpdateWorkflowSettingsUseCase]`, `getSettings()` returns `getWorkflowSettingsUseCase.execute()` and `updateSettings(settings)` returns `updateWorkflowSettingsUseCase.execute(settings)`. The bridge has no test of its own. `WorkflowSettingsUseCases.test.ts` is deleted, and its cases are ported: envelope conversion to `WorkflowSettingsGateway.test.ts`, the `includeExpired` rule and mapping to `GetWorkflowSettingsUseCase.test.ts`, and the DTO sent and the saved record to `UpdateWorkflowSettingsUseCase.test.ts`. Task 14 deletes the bridge, its interface, its token and `createFakeSettingsUseCases`.
- **Root tests:** `[AW]/app.test.tsx` resolves the gateway, the repository (both singletons) and the two use cases (transient) with the flag on. With the flag off, each resolve throws. The bridge assertions stay. `[AW]/app.cleanup.test.tsx` `KEPT_PATHS` gains `gateway`.
- **No behaviour change (R342):** the same documents, variables, values and errors (`GraphQLOperationError` with `message`, `code` and `data`; the fallback `The request failed.`; transport `Error` as is). Users see nothing new.

**Files:**
- Move: `packages/app-workflows/src/editor/useCases/toOperationError.ts` → `packages/app-workflows/src/gateway/toOperationError.ts`
- Move: `packages/app-workflows/src/editor/useCases/toOperationError.test.ts` → `packages/app-workflows/src/gateway/toOperationError.test.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts` (import path)
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts` (import path)
- Modify: `packages/app-workflows/src/settings/gateway/IWorkflowSettingsGateway.ts`
- Modify: `packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.ts`
- Modify (rewrite): `packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.test.ts`
- Create: `packages/app-workflows/src/settings/repository/abstractions.ts`
- Create: `packages/app-workflows/src/settings/repository/WorkflowSettingsRepository.ts`
- Create: `packages/app-workflows/src/settings/repository/feature.ts`
- Create: `packages/app-workflows/src/settings/useCases/getWorkflowSettings/abstractions.ts`
- Create: `packages/app-workflows/src/settings/useCases/getWorkflowSettings/GetWorkflowSettingsUseCase.ts`
- Create: `packages/app-workflows/src/settings/useCases/getWorkflowSettings/feature.ts`
- Create: `packages/app-workflows/src/settings/useCases/getWorkflowSettings/GetWorkflowSettingsUseCase.test.ts`
- Create: `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/abstractions.ts`
- Create: `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/UpdateWorkflowSettingsUseCase.ts`
- Create: `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/feature.ts`
- Create: `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/UpdateWorkflowSettingsUseCase.test.ts`
- Modify (rewrite): `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.ts` (bridge)
- Delete: `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.test.ts`
- Modify (rewrite): `packages/app-workflows/src/settings/feature.ts`
- Modify (rewrite): `packages/app-workflows/src/settings/feature.test.ts`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.cleanup.test.tsx`

**Interfaces:**
- Consumes (verified at HEAD by reading the source): `createAbstraction`, `createFeature` (`@webiny/feature/admin`; `createFeature`'s `resolve` is optional, `packages/feature/src/admin/createFeature.ts:12-16`), `Container` (`@webiny/di`), `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`), `GraphQLOperationError` (`@webiny/app/errors/index.js`), `EditorEnvelope`, `EditorErrorDto`, `WorkflowsOperationResponse` (`~/editor/gateway/dto.js`), `ERROR_FIELDS` (`~/review/gateway/reviewFields.js`), `SETTINGS_FIELDS` (`~/settings/gateway/settingsFields.js`), `WorkflowSettingsDto`, `WorkflowExclusionDto` (`~/settings/gateway/dto.js`), `mapWorkflowSettings` (`~/settings/gateway/mapWorkflowSettings.js`), `toWorkflowSettingsDto` (`~/settings/gateway/toWorkflowSettingsDto.js`), `WorkflowSettings` (`~/settings/domain/types.js`), `SettingsErrorCode` (`~/settings/domain/SettingsErrorCode.js`), `createExclusion` (`~/settings/testing/settingsFixtures.js`), the `WorkflowSettingsGateway` token (`~/settings/gateway/abstractions.js`), the `WorkflowSettingsUseCases` token and `IWorkflowSettingsUseCases` (`~/settings/useCases/abstractions.js`, `IWorkflowSettingsUseCases.js`).
- Produces (the contract's Task 1 entry): `toOperationError(error: EditorErrorDto | null): GraphQLOperationError` at `~/gateway/toOperationError.js`; `IWorkflowSettingsGateway` returning DTOs and throwing; `WorkflowSettingsRepository` (token `Workflows/WorkflowSettingsRepository`, `WorkflowSettingsRepository.Interface`), `WorkflowSettingsRepositoryFeature`; `GetWorkflowSettingsUseCase` (token `Workflows/GetWorkflowSettingsUseCase`, `.Interface`), `GetWorkflowSettingsFeature`; `UpdateWorkflowSettingsUseCase` (token `Workflows/UpdateWorkflowSettingsUseCase`, `.Interface`, `.Params`), `UpdateWorkflowSettingsFeature`; `WorkflowSettingsServicesFeature` without `resolve`. Task 2 consumes the two use cases. Task 3 consumes `toOperationError` at its new path. Task 14 deletes the bridge.

**Test runner note:** admin package. Run `yarn test <path>` one file at a time, never `test:os` and never the whole package. `app-workflows` has a `__tests__` folder, so the type check is `yarn check:test:types -p app-workflows --report cli` together with the package build (8a R243).

- [ ] **Step 1: Write the failing tests**

Move the helper's test to its new home. Its content does not change: it imports `./toOperationError.js`, which does not exist there until Step 3. `git mv` does not create the target folder, so create it first:

```bash
mkdir -p packages/app-workflows/src/gateway
git mv packages/app-workflows/src/editor/useCases/toOperationError.test.ts packages/app-workflows/src/gateway/toOperationError.test.ts
```

Rewrite `packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.test.ts` (R355: fake client, real gateway; documents and variables as today; the envelope is unwrapped; a server error becomes a `GraphQLOperationError` with code and data; an error without a message gets the fallback; missing data gets the fallback; a transport failure passes as it is):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettingsDto } from "./dto.js";
import { SETTINGS_FIELDS } from "./settingsFields.js";
import { WorkflowSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { WorkflowSettingsGateway } from "./WorkflowSettingsGateway.js";

const SETTINGS: WorkflowSettingsDto = {
    exclusions: [
        { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" },
        { userId: "user-2", reason: null, endsOn: null }
    ]
};

interface OperationCase {
    name: string;
    field: "getSettings" | "updateSettings";
    run: (gateway: GatewayAbstraction.Interface) => Promise<WorkflowSettingsDto>;
}

const operationCases: OperationCase[] = [
    {
        name: "getSettings",
        field: "getSettings",
        run: gateway => gateway.getSettings({ includeExpired: true })
    },
    {
        name: "updateSettings",
        field: "updateSettings",
        run: gateway => gateway.updateSettings(SETTINGS)
    }
];

describe("WorkflowSettingsGateway (R317, R346)", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WorkflowSettingsGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("reads the settings on the workflows root with includeExpired as the variable", async () => {
        client.execute.mockResolvedValue({
            workflows: { getSettings: { data: SETTINGS, error: null } }
        });

        const result = await gateway.getSettings({ includeExpired: true });

        expect(result).toEqual(SETTINGS);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: true });
        expect(request.query).toContain("query GetWorkflowSettings($includeExpired: Boolean)");
        expect(request.query).toContain("workflows");
        expect(request.query).toContain("getSettings(includeExpired: $includeExpired)");
        expect(request.query).toContain(SETTINGS_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("passes includeExpired through as it is given", async () => {
        client.execute.mockResolvedValue({
            workflows: { getSettings: { data: { exclusions: [] }, error: null } }
        });

        await gateway.getSettings({ includeExpired: false });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: false });
    });

    it("updates the settings with the whole list as the data variable", async () => {
        client.execute.mockResolvedValue({
            workflows: { updateSettings: { data: SETTINGS, error: null } }
        });

        const result = await gateway.updateSettings(SETTINGS);

        expect(result).toEqual(SETTINGS);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ data: SETTINGS });
        expect(request.query).toContain(
            "mutation UpdateWorkflowSettings($data: WorkflowsSettingsInput!)"
        );
        expect(request.query).toContain("updateSettings(data: $data)");
        expect(request.query).toContain(SETTINGS_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("sends a null reason and a null end date as null", async () => {
        client.execute.mockResolvedValue({
            workflows: { updateSettings: { data: SETTINGS, error: null } }
        });

        await gateway.updateSettings(SETTINGS);

        const request = client.execute.mock.calls[0][0];
        expect(request.variables.data.exclusions[1]).toEqual({
            userId: "user-2",
            reason: null,
            endsOn: null
        });
    });

    it("throws a validation error of a save with its code, message and data", async () => {
        client.execute.mockResolvedValue({
            workflows: {
                updateSettings: {
                    data: null,
                    error: {
                        code: SettingsErrorCode.Validation,
                        message: "This user is already in the list. Edit it instead.",
                        data: { userId: "user-1" }
                    }
                }
            }
        });

        const promise = gateway.updateSettings(SETTINGS);

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            code: SettingsErrorCode.Validation,
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        });
    });

    describe("errors (R346)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError with the code, message and data of an error envelope",
            async operationCase => {
                const data = { action: "change the workflow settings" };
                client.execute.mockResolvedValue({
                    workflows: {
                        [operationCase.field]: {
                            data: null,
                            error: {
                                code: SettingsErrorCode.NotAuthorized,
                                message: "You are not allowed to change the workflow settings.",
                                data
                            }
                        }
                    }
                });

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: SettingsErrorCode.NotAuthorized,
                    message: "You are not allowed to change the workflow settings.",
                    data
                });
            }
        );

        it.each(operationCases)(
            "$name uses the fallback message for an error without a message",
            async operationCase => {
                client.execute.mockResolvedValue({
                    workflows: {
                        [operationCase.field]: {
                            data: null,
                            error: {
                                code: SettingsErrorCode.Persistence,
                                message: null,
                                data: null
                            }
                        }
                    }
                });

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: SettingsErrorCode.Persistence,
                    message: "The request failed.",
                    data: null
                });
            }
        );

        it.each(operationCases)(
            "$name throws the fallback error when the server answers with neither data nor error",
            async operationCase => {
                client.execute.mockResolvedValue({
                    workflows: { [operationCase.field]: { data: null, error: null } }
                });

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "The request failed.",
                    code: null,
                    data: null
                });
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass as it is",
            async operationCase => {
                const failure = new Error("Network down.");
                client.execute.mockRejectedValue(failure);

                await expect(operationCase.run(gateway)).rejects.toBe(failure);
            }
        );
    });
});
```

Create `packages/app-workflows/src/settings/useCases/getWorkflowSettings/GetWorkflowSettingsUseCase.test.ts` (R355: fake gateway instance, real repository):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import type { WorkflowExclusionDto } from "~/settings/gateway/dto.js";
import type { WorkflowSettingsDto } from "~/settings/gateway/dto.js";
import { WorkflowSettingsRepository } from "~/settings/repository/WorkflowSettingsRepository.js";
import { GetWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowSettingsUseCase } from "./GetWorkflowSettingsUseCase.js";

interface FakeGateway {
    getSettings: Mock<WorkflowSettingsGateway.Interface["getSettings"]>;
    updateSettings: Mock<WorkflowSettingsGateway.Interface["updateSettings"]>;
}

const createFakeGateway = (): FakeGateway => {
    return {
        getSettings: vi.fn(),
        updateSettings: vi.fn()
    };
};

describe("GetWorkflowSettingsUseCase (R317, R351)", () => {
    let gateway: FakeGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeGateway();
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, gateway);
        container.register(WorkflowSettingsRepository).inSingletonScope();
        container.register(GetWorkflowSettingsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("always reads the settings with the expired entries (R317)", async () => {
        gateway.getSettings.mockResolvedValue({ exclusions: [] });

        await useCase.execute();

        expect(gateway.getSettings).toHaveBeenCalledTimes(1);
        expect(gateway.getSettings).toHaveBeenCalledWith({ includeExpired: true });
        expect(gateway.updateSettings).not.toHaveBeenCalled();
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
        gateway.getSettings.mockResolvedValue(dto);

        const settings = await useCase.execute();

        expect(settings).toEqual({
            exclusions: [
                { userId: "user-3", reason: "Old", endsOn: "2020-01-01T00:00:00.000Z" },
                { userId: "user-2", reason: null, endsOn: null }
            ]
        });
    });

    it("lets the gateway's GraphQLOperationError pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "You are not allowed to view the workflow settings.",
            code: SettingsErrorCode.NotAuthorized,
            data: { action: "view the workflow settings" }
        });
        gateway.getSettings.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });

    it("lets a transport failure pass as it is", async () => {
        const failure = new Error("Network down.");
        gateway.getSettings.mockRejectedValue(failure);

        await expect(useCase.execute()).rejects.toBe(failure);
    });

    it("is transient: every resolve is a new instance", () => {
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, createFakeGateway());
        container.register(WorkflowSettingsRepository).inSingletonScope();
        container.register(GetWorkflowSettingsUseCase);

        expect(container.resolve(UseCaseAbstraction)).not.toBe(
            container.resolve(UseCaseAbstraction)
        );
    });
});
```

Create `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/UpdateWorkflowSettingsUseCase.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import type { WorkflowSettingsDto } from "~/settings/gateway/dto.js";
import { WorkflowSettingsRepository } from "~/settings/repository/WorkflowSettingsRepository.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { UpdateWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "./UpdateWorkflowSettingsUseCase.js";

interface FakeGateway {
    getSettings: Mock<WorkflowSettingsGateway.Interface["getSettings"]>;
    updateSettings: Mock<WorkflowSettingsGateway.Interface["updateSettings"]>;
}

const createFakeGateway = (): FakeGateway => {
    return {
        getSettings: vi.fn(),
        updateSettings: vi.fn()
    };
};

const SAVED: WorkflowSettings = {
    exclusions: [createExclusion({ userId: "user-1", reason: "On leave" })]
};

describe("UpdateWorkflowSettingsUseCase (R317, R318, A108)", () => {
    let gateway: FakeGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeGateway();
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, gateway);
        container.register(WorkflowSettingsRepository).inSingletonScope();
        container.register(UpdateWorkflowSettingsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
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
        gateway.updateSettings.mockResolvedValue(saved);

        const result = await useCase.execute(settings);

        expect(gateway.updateSettings).toHaveBeenCalledTimes(1);
        expect(gateway.updateSettings).toHaveBeenCalledWith({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: null },
                { userId: "user-2", reason: null, endsOn: "2020-01-01T00:00:00.000Z" }
            ]
        });
        expect(gateway.getSettings).not.toHaveBeenCalled();
        expect(result).toEqual(settings);
        expect(result).not.toBe(settings);
    });

    it("sends an empty list as an empty list", async () => {
        gateway.updateSettings.mockResolvedValue({ exclusions: [] });

        const result = await useCase.execute({ exclusions: [] });

        expect(gateway.updateSettings).toHaveBeenCalledWith({ exclusions: [] });
        expect(result).toEqual({ exclusions: [] });
    });

    it("lets a validation error of a save pass with its code, message and data", async () => {
        const error = new GraphQLOperationError({
            message: "This user is already in the list. Edit it instead.",
            code: SettingsErrorCode.Validation,
            data: { userId: "user-1" }
        });
        gateway.updateSettings.mockRejectedValue(error);

        const promise = useCase.execute(SAVED);

        await expect(promise).rejects.toBe(error);
        await expect(promise).rejects.toMatchObject({
            code: SettingsErrorCode.Validation,
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        });
    });

    it("lets a transport failure pass as it is", async () => {
        const failure = new Error("Network down.");
        gateway.updateSettings.mockRejectedValue(failure);

        await expect(useCase.execute(SAVED)).rejects.toBe(failure);
    });

    it("is transient: every resolve is a new instance", () => {
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, createFakeGateway());
        container.register(WorkflowSettingsRepository).inSingletonScope();
        container.register(UpdateWorkflowSettingsUseCase);

        expect(container.resolve(UseCaseAbstraction)).not.toBe(
            container.resolve(UseCaseAbstraction)
        );
    });
});
```

Rewrite `packages/app-workflows/src/settings/feature.test.ts` (R354: no `resolve`; gateway and repository singletons; use cases transient; the bridge still resolves):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WorkflowSettingsServicesFeature } from "./feature.js";
import { WorkflowSettingsGateway } from "./gateway/abstractions.js";
import { WorkflowSettingsRepository } from "./repository/abstractions.js";
import { GetWorkflowSettingsUseCase } from "./useCases/getWorkflowSettings/abstractions.js";
import { GetWorkflowSettingsFeature } from "./useCases/getWorkflowSettings/feature.js";
import { UpdateWorkflowSettingsUseCase } from "./useCases/updateWorkflowSettings/abstractions.js";
import { UpdateWorkflowSettingsFeature } from "./useCases/updateWorkflowSettings/feature.js";
import { WorkflowSettingsUseCases } from "./useCases/abstractions.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    WorkflowSettingsServicesFeature.register(container);
    return container;
};

describe("WorkflowSettingsServicesFeature (R317, R354)", () => {
    it("registers the settings gateway and repository as singletons", () => {
        const container = createContainer();

        expect(container.resolve(WorkflowSettingsGateway)).toBeDefined();
        expect(container.resolve(WorkflowSettingsGateway)).toBe(
            container.resolve(WorkflowSettingsGateway)
        );
        expect(container.resolve(WorkflowSettingsRepository)).toBeDefined();
        expect(container.resolve(WorkflowSettingsRepository)).toBe(
            container.resolve(WorkflowSettingsRepository)
        );
    });

    it("registers the two settings use cases transient", () => {
        const container = createContainer();

        const firstGet = container.resolve(GetWorkflowSettingsUseCase);
        const firstUpdate = container.resolve(UpdateWorkflowSettingsUseCase);
        expect(firstGet).toBeDefined();
        expect(firstUpdate).toBeDefined();
        expect(firstGet).not.toBe(container.resolve(GetWorkflowSettingsUseCase));
        expect(firstUpdate).not.toBe(container.resolve(UpdateWorkflowSettingsUseCase));
    });

    it("resolves each use case through its own feature", () => {
        const container = createContainer();

        expect(GetWorkflowSettingsFeature.resolve(container).useCase).toBeDefined();
        expect(UpdateWorkflowSettingsFeature.resolve(container).useCase).toBeDefined();
    });

    it("keeps the settings use-case bridge as a singleton until the cleanup (R356)", () => {
        const container = createContainer();

        expect(container.resolve(WorkflowSettingsUseCases)).toBeDefined();
        expect(container.resolve(WorkflowSettingsUseCases)).toBe(
            container.resolve(WorkflowSettingsUseCases)
        );
    });

    it("runs GetWorkflowSettingsUseCase over the gateway with the expired entries", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                getSettings: {
                    data: { exclusions: [{ userId: "user-1", reason: null, endsOn: null }] },
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        const useCase = container.resolve(GetWorkflowSettingsUseCase);

        const settings = await useCase.execute();

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

Before (imports, line 27):

```ts
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
```

After:

```ts
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import { WorkflowSettingsRepository } from "~/settings/repository/abstractions.js";
import { GetWorkflowSettingsUseCase } from "~/settings/useCases/getWorkflowSettings/abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";
```

Before (the settings services block):

```ts
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
```

After:

```ts
    it("registers the settings use cases as a singleton when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        const first = container.resolve(WorkflowSettingsUseCases);
        expect(first).toBeDefined();
        expect(first).toBe(container.resolve(WorkflowSettingsUseCases));
    });

    it("registers the settings gateway and repository as singletons when the flag is on (R354)", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowSettingsGateway)).toBeDefined();
        expect(container.resolve(WorkflowSettingsGateway)).toBe(
            container.resolve(WorkflowSettingsGateway)
        );
        expect(container.resolve(WorkflowSettingsRepository)).toBeDefined();
        expect(container.resolve(WorkflowSettingsRepository)).toBe(
            container.resolve(WorkflowSettingsRepository)
        );
    });

    it("registers the two settings use cases transient when the flag is on (R344)", () => {
        const container = mount(true);

        const getSettings = container.resolve(GetWorkflowSettingsUseCase);
        const updateSettings = container.resolve(UpdateWorkflowSettingsUseCase);
        expect(getSettings).toBeDefined();
        expect(updateSettings).toBeDefined();
        expect(getSettings).not.toBe(container.resolve(GetWorkflowSettingsUseCase));
        expect(updateSettings).not.toBe(container.resolve(UpdateWorkflowSettingsUseCase));
    });

    it("registers no settings service when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowSettingsUseCases)).toThrow();
        expect(() => container.resolve(WorkflowSettingsGateway)).toThrow();
        expect(() => container.resolve(WorkflowSettingsRepository)).toThrow();
        expect(() => container.resolve(GetWorkflowSettingsUseCase)).toThrow();
        expect(() => container.resolve(UpdateWorkflowSettingsUseCase)).toThrow();
    });
});
```

Modify `packages/app-workflows/src/app.cleanup.test.tsx`.

Before:

```ts
const KEPT_PATHS = [
    "domain/permissions",
    "presentation/permissions",
    "settings",
```

After:

```ts
const KEPT_PATHS = [
    "domain/permissions",
    "presentation/permissions",
    "gateway",
    "settings",
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/gateway/toOperationError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/settings/useCases/getWorkflowSettings/GetWorkflowSettingsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/useCases/updateWorkflowSettings/UpdateWorkflowSettingsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
```

Expected:
- `toOperationError.test.ts`, the two use-case tests, `feature.test.ts` and `app.test.tsx` fail with `Failed to resolve import` (`./toOperationError.js`, `~/settings/repository/...`, `./abstractions.js`, `./useCases/getWorkflowSettings/...`).
- `WorkflowSettingsGateway.test.ts` fails on every read and save case: the gateway still resolves with the envelope (`expected { data: ..., error: null } to deeply equal { exclusions: [...] }`), and the error cases resolve instead of rejecting.
- `app.cleanup.test.tsx` fails only on `gateway is kept`.

Record the RED output.

- [ ] **Step 3: Implement**

Move the helper:

```bash
git mv packages/app-workflows/src/editor/useCases/toOperationError.ts packages/app-workflows/src/gateway/toOperationError.ts
```

Then change only its comment, in `packages/app-workflows/src/gateway/toOperationError.ts`.

Before:

```ts
/*
 * The error a use case throws for an envelope that carries an error, or neither data nor error
 * (R204): the server's message, code and data, with a fallback message.
 */
```

After:

```ts
/*
 * The error an area gateway throws for an envelope that carries an error, or neither data nor
 * error (R346): the server's message, code and data, with a fallback message.
 */
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts`.

Before:

```ts
import { toOperationError } from "./toOperationError.js";
```

After:

```ts
import { toOperationError } from "~/gateway/toOperationError.js";
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts`.

Before:

```ts
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./abstractions.js";
import { toOperationError } from "./toOperationError.js";
```

After:

```ts
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./abstractions.js";
import { toOperationError } from "~/gateway/toOperationError.js";
```

Replace `packages/app-workflows/src/settings/gateway/IWorkflowSettingsGateway.ts`:

```ts
import type { WorkflowSettingsDto } from "./dto.js";

export interface GetSettingsParams {
    // Also the entries whose end date has passed; the settings page always asks for them (R317).
    includeExpired: boolean;
}

/*
 * The settings operations on the shared `workflows` root (R317). Every method resolves with the
 * envelope's data. It throws a `GraphQLOperationError` for an error envelope or an envelope
 * without data, and lets a transport failure pass as it is (R346).
 */
export interface IWorkflowSettingsGateway {
    getSettings(params: GetSettingsParams): Promise<WorkflowSettingsDto>;
    updateSettings(data: WorkflowSettingsDto): Promise<WorkflowSettingsDto>;
}
```

Replace `packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { WorkflowsOperationResponse } from "~/editor/gateway/dto.js";
import { toOperationError } from "~/gateway/toOperationError.js";
import type { WorkflowSettingsDto } from "./dto.js";
import type { GetSettingsParams } from "./IWorkflowSettingsGateway.js";
import { WorkflowSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { SETTINGS_FIELDS } from "./settingsFields.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetWorkflowSettings($includeExpired: Boolean) {
        workflows {
            getSettings(includeExpired: $includeExpired) {
                data {
                    ${SETTINGS_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateWorkflowSettings($data: WorkflowsSettingsInput!) {
        workflows {
            updateSettings(data: $data) {
                data {
                    ${SETTINGS_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

/*
 * The settings operations on the shared `workflows` root, one implementation for every app
 * (R317). The mutation document travels in `query`, which `MainGraphQLClient` accepts for any
 * document (A107). The gateway unwraps the envelope and throws its error (R346); mapping is the
 * repository's job.
 */
class WorkflowSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async getSettings(params: GetSettingsParams): Promise<WorkflowSettingsDto> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"getSettings", EditorEnvelope<WorkflowSettingsDto>>
        >({
            query: GET_SETTINGS,
            variables: { includeExpired: params.includeExpired }
        });

        const envelope = response.workflows.getSettings;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async updateSettings(data: WorkflowSettingsDto): Promise<WorkflowSettingsDto> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"updateSettings", EditorEnvelope<WorkflowSettingsDto>>
        >({
            query: UPDATE_SETTINGS,
            variables: { data }
        });

        const envelope = response.workflows.updateSettings;
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }
}

export const WorkflowSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

Create `packages/app-workflows/src/settings/repository/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { GetSettingsParams } from "~/settings/gateway/IWorkflowSettingsGateway.js";

/*
 * The settings area's data (R343): it calls the settings gateway and maps DTO to domain, and, for
 * a save, domain to DTO (R351). No cache. Every error of the gateway passes as it is: a
 * `GraphQLOperationError` for a server error and the transport `Error` as is.
 */
export interface IWorkflowSettingsRepository {
    getSettings(params: GetSettingsParams): Promise<WorkflowSettings>;
    updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings>;
}

export const WorkflowSettingsRepository = createAbstraction<IWorkflowSettingsRepository>(
    "Workflows/WorkflowSettingsRepository"
);

export namespace WorkflowSettingsRepository {
    export type Interface = IWorkflowSettingsRepository;
}
```

Create `packages/app-workflows/src/settings/repository/WorkflowSettingsRepository.ts`:

```ts
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import type { GetSettingsParams } from "~/settings/gateway/IWorkflowSettingsGateway.js";
import { mapWorkflowSettings } from "~/settings/gateway/mapWorkflowSettings.js";
import { toWorkflowSettingsDto } from "~/settings/gateway/toWorkflowSettingsDto.js";
import { WorkflowSettingsRepository as RepositoryAbstraction } from "./abstractions.js";

/*
 * One implementation for every app: the settings live on the shared `workflows` root and the
 * gateway is bound once (R317). A save replaces the whole record and the server returns it as
 * saved (D106, A108), so the saved record is mapped and returned.
 */
class WorkflowSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: WorkflowSettingsGateway.Interface) {}

    public async getSettings(params: GetSettingsParams): Promise<WorkflowSettings> {
        const dto = await this.gateway.getSettings(params);
        return mapWorkflowSettings(dto);
    }

    public async updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> {
        const data = toWorkflowSettingsDto(settings);
        const dto = await this.gateway.updateSettings(data);
        return mapWorkflowSettings(dto);
    }
}

export const WorkflowSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: WorkflowSettingsRepositoryImpl,
    dependencies: [WorkflowSettingsGateway]
});
```

Create `packages/app-workflows/src/settings/repository/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsGateway } from "~/settings/gateway/WorkflowSettingsGateway.js";
import { WorkflowSettingsRepository } from "./WorkflowSettingsRepository.js";

// The settings area's gateway and repository, both singletons (R343, R354).
export const WorkflowSettingsRepositoryFeature = createFeature({
    name: "Workflows/WorkflowSettingsRepository",
    register(container) {
        container.register(WorkflowSettingsGateway).inSingletonScope();
        container.register(WorkflowSettingsRepository).inSingletonScope();
    }
});
```

Create `packages/app-workflows/src/settings/useCases/getWorkflowSettings/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowSettings } from "~/settings/domain/types.js";

/*
 * Reads the tenant's workflow settings, always with the expired entries (R317, R351): a save
 * replaces the whole record, so an entry the page never loaded would be deleted by the next save.
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IGetWorkflowSettingsUseCase {
    execute(): Promise<WorkflowSettings>;
}

export const GetWorkflowSettingsUseCase = createAbstraction<IGetWorkflowSettingsUseCase>(
    "Workflows/GetWorkflowSettingsUseCase"
);

export namespace GetWorkflowSettingsUseCase {
    export type Interface = IGetWorkflowSettingsUseCase;
}
```

Create `packages/app-workflows/src/settings/useCases/getWorkflowSettings/GetWorkflowSettingsUseCase.ts`:

```ts
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { GetSettingsParams } from "~/settings/gateway/IWorkflowSettingsGateway.js";
import { WorkflowSettingsRepository } from "~/settings/repository/abstractions.js";
import { GetWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetWorkflowSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    public async execute(): Promise<WorkflowSettings> {
        const params: GetSettingsParams = { includeExpired: true };
        return this.repository.getSettings(params);
    }
}

export const GetWorkflowSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
```

Create `packages/app-workflows/src/settings/useCases/getWorkflowSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { GetWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowSettingsUseCase } from "./GetWorkflowSettingsUseCase.js";

export const GetWorkflowSettingsFeature = createFeature({
    name: "Workflows/GetWorkflowSettings",
    register(container) {
        container.register(GetWorkflowSettingsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Create `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowSettings } from "~/settings/domain/types.js";

/*
 * Replaces the tenant's workflow settings record with the given one and returns it as saved
 * (D106, A108). Throws a `GraphQLOperationError` for a server error and the transport `Error` as
 * is (R360).
 */
export interface IUpdateWorkflowSettingsUseCase {
    execute(params: WorkflowSettings): Promise<WorkflowSettings>;
}

export const UpdateWorkflowSettingsUseCase = createAbstraction<IUpdateWorkflowSettingsUseCase>(
    "Workflows/UpdateWorkflowSettingsUseCase"
);

export namespace UpdateWorkflowSettingsUseCase {
    export type Interface = IUpdateWorkflowSettingsUseCase;
    export type Params = WorkflowSettings;
}
```

Create `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/UpdateWorkflowSettingsUseCase.ts`:

```ts
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { WorkflowSettingsRepository } from "~/settings/repository/abstractions.js";
import { UpdateWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class UpdateWorkflowSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    public async execute(params: UseCaseAbstraction.Params): Promise<WorkflowSettings> {
        return this.repository.updateSettings(params);
    }
}

export const UpdateWorkflowSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
```

Create `packages/app-workflows/src/settings/useCases/updateWorkflowSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { UpdateWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "./UpdateWorkflowSettingsUseCase.js";

export const UpdateWorkflowSettingsFeature = createFeature({
    name: "Workflows/UpdateWorkflowSettings",
    register(container) {
        container.register(UpdateWorkflowSettingsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

Replace `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.ts` with the bridge (R356):

```ts
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { GetWorkflowSettingsUseCase } from "./getWorkflowSettings/abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "./updateWorkflowSettings/abstractions.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * A temporary delegate over the two settings use cases (R356): it keeps the presenters that still
 * inject the bundle working until they inject the use cases themselves. Task 14 deletes it.
 */
class WorkflowSettingsUseCasesImpl implements UseCasesAbstraction.Interface {
    constructor(
        private getWorkflowSettingsUseCase: GetWorkflowSettingsUseCase.Interface,
        private updateWorkflowSettingsUseCase: UpdateWorkflowSettingsUseCase.Interface
    ) {}

    public async getSettings(): Promise<WorkflowSettings> {
        return this.getWorkflowSettingsUseCase.execute();
    }

    public async updateSettings(settings: WorkflowSettings): Promise<WorkflowSettings> {
        return this.updateWorkflowSettingsUseCase.execute(settings);
    }
}

export const WorkflowSettingsUseCases = UseCasesAbstraction.createImplementation({
    implementation: WorkflowSettingsUseCasesImpl,
    dependencies: [GetWorkflowSettingsUseCase, UpdateWorkflowSettingsUseCase]
});
```

Delete the old bundle test. Its cases now live in the gateway test and the two use-case tests:

```bash
git rm packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.test.ts
```

Replace `packages/app-workflows/src/settings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsRepositoryFeature } from "./repository/feature.js";
import { GetWorkflowSettingsFeature } from "./useCases/getWorkflowSettings/feature.js";
import { UpdateWorkflowSettingsFeature } from "./useCases/updateWorkflowSettings/feature.js";
import { WorkflowSettingsUseCases } from "./useCases/WorkflowSettingsUseCases.js";

/*
 * The app-neutral settings services, registered once by `WorkflowsAdminApp` inside the feature
 * flag gate (R211, R317, R354): the settings gateway and repository (singletons), the two settings
 * use cases (transient) and, until Task 14, the `WorkflowSettingsUseCases` bridge (R356). User
 * names and the user search use the shared configuration lookups.
 */
export const WorkflowSettingsServicesFeature = createFeature({
    name: "Workflows/WorkflowSettingsServices",
    register(container) {
        WorkflowSettingsRepositoryFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        UpdateWorkflowSettingsFeature.register(container);
        container.register(WorkflowSettingsUseCases).inSingletonScope();
    }
});
```

`[AW]/app.tsx` does not change: it already registers `WorkflowSettingsServicesFeature` inside the `advancedPublishingWorkflow` gate.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/gateway/toOperationError.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/useCases/getWorkflowSettings/GetWorkflowSettingsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/useCases/updateWorkflowSettings/UpdateWorkflowSettingsUseCase.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
```

Expected: all pass. The singleton bridge holds the transient use cases it was built with. That is fine: the use cases hold no state.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

Run one command after the other. These cover the importers of the moved helper and the presenters that still reach the settings through the bridge (their fakes do not change in this task):

```bash
yarn test packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/mapWorkflowSettings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/toWorkflowSettingsDto.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/mounting/ExclusionsSettings.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Then check that nothing imports the old helper path, the deleted test or the removed `resolve`:

```bash
grep -rn "editor/useCases/toOperationError\|\./toOperationError.js\|settingsUseCases" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
```

Expected: all tests pass and there are no TypeScript errors. The grep shows only `packages/app-workflows/src/gateway/toOperationError.test.ts` (its own `./toOperationError.js`) and the `settingsUseCases` field of `ExclusionsPagePresenter.ts`, which Task 2 renames.

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
git commit -m "refactor(app-workflows): split the settings data layer into gateway, repository and use cases" -m "The shared error helper moves to src/gateway, because from now on only area gateways convert an error envelope. The settings gateway unwraps the envelope and throws a GraphQLOperationError (the fallback message and transport failures unchanged). WorkflowSettingsRepository maps DTO to domain and back. GetWorkflowSettingsUseCase (always with the expired entries) and UpdateWorkflowSettingsUseCase replace the two bundle methods. The old WorkflowSettingsUseCases stays as a delegate over them until the presenters inject the use cases." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file or fails, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`. Never push, amend or revert.

## Contract notes

- **`toOperationError` comment:** R346 says the helper moves unchanged. The code is unchanged. Its comment now says "an area gateway throws" in place of "a use case throws" (R204 → R346), because it would be wrong after the move.
- **`GetWorkflowSettingsUseCase.Params`:** the operation takes no input (R348 row 1, "none"), so the namespace declares only `Interface`. A `Params` alias for `void` would add a name nobody uses.
- **`settingsUseCases` resolve key:** `WorkflowSettingsServicesFeature.resolve` (`{ settingsUseCases }`) is removed (R354). The only caller was `[AWS]/feature.test.ts`, which is rewritten. `RegisterFeature` does not call `resolve`.
- **Bridge scope:** the bridge stays a singleton, as the bundle was. It holds one instance of each transient use case. They are stateless, so nothing changes. Task 2 makes it unused, and Task 14 deletes it (R356, R358).
- **No `WorkflowSettingsRepository.test.ts`:** the contract lists no repository test for this area. Mapping and the DTO sent are proven through the real repository in the two use-case tests (R355).
- Size: medium (one move, one rewritten gateway, nine new source files, three rewritten or new tests and two root-test hunks).

## Review fixes (sub-phase review)

- Consistency ruling (injected use-case fields keep the `UseCase` suffix): the bridge `WorkflowSettingsUseCasesImpl` fields are now `getWorkflowSettingsUseCase` and `updateWorkflowSettingsUseCase` (Step 3 code and the Bridge bullet).
- Checked against HEAD, no other change: `toOperationError` source and its three importers, `IWorkflowSettingsGateway.ts`, `WorkflowSettingsGateway.ts` documents and variables, `settings/feature.ts`, the `app.test.tsx` line-27 import and settings `describe`, `KEPT_PATHS`, `SettingsErrorCode` members, `createExclusion`, and the cases of the deleted `WorkflowSettingsUseCases.test.ts` (all ported).
