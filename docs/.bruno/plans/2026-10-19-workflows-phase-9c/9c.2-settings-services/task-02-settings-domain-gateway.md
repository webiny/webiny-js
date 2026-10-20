### Task 2: Settings domain and gateway

R316, R317 (settings services, envelope rule, `string | null` domain), A107 (a mutation document in `query`), A112 (`endsOn` an ISO UTC string or `null`, `reason` a string or `null`); inherited R204 (gateways never throw for an envelope error), R238 (token file named after the token, `<Token>Impl.ts`, namespace types), Q62, Q65 (no API change); Review Focus 1 (`00-shared.md`). The 9c Global Constraints and everything they inherit apply unchanged (read: one named import per line, no inline object types, no nested call arguments, comments end with a period, targeted tests by path, the pre-commit chain).

The settings area `[AWS]` = `packages/app-workflows/src/settings` starts here, next to `[AWE]`. This task adds its domain types, the error codes, the DTOs, the field selection and the gateway for the two existing operations on the shared `workflows` root (`[AWF]/graphql/WorkflowsSchemaFactory.ts:435-459, 553-580`, read only): `query { workflows { getSettings(includeExpired: Boolean): WorkflowsSettingsResponse! } }` and `mutation { workflows { updateSettings(data: WorkflowsSettingsInput!): WorkflowsSettingsResponse! } }`. Nothing is registered yet (Task 3 registers the gateway and the use cases in one feature).

- **Domain** (`[AWS]/domain/types.ts`): `WorkflowExclusion { userId: string; reason: string | null; endsOn: string | null }` and `WorkflowSettings { exclusions: WorkflowExclusion[] }`. `endsOn` is the stored ISO UTC instant (D43); `null` means "until removed".
- **Error codes** (`[AWS]/domain/SettingsErrorCode.ts`): `{ Validation: "Workflows/Settings/Validation", Persistence: "Workflows/Settings/Persistence", NotAuthorized: "Workflows/NotAuthorized", NotAuthenticated: "Workflows/NotAuthenticated" } as const` (the codes `[AWF]/domain/settings/errors.ts` and `[AWF]/domain/permissions/errors.ts` send).
- **DTOs** (`[AWS]/gateway/dto.ts`): `WorkflowExclusionDto { userId: string; reason: string | null; endsOn: string | null }`, `WorkflowSettingsDto { exclusions: WorkflowExclusionDto[] }` — the same shape for the response selection and for the `WorkflowsSettingsInput` variable.
- **Fields** (`[AWS]/gateway/settingsFields.ts`): `SETTINGS_FIELDS` selects `exclusions { userId reason endsOn }`.
- **Gateway interface** (`[AWS]/gateway/IWorkflowSettingsGateway.ts`): `GetSettingsParams { includeExpired: boolean }` and `IWorkflowSettingsGateway { getSettings(params: GetSettingsParams): Promise<EditorEnvelope<WorkflowSettingsDto>>; updateSettings(data: WorkflowSettingsDto): Promise<EditorEnvelope<WorkflowSettingsDto>> }`.
- **Token** (`[AWS]/gateway/WorkflowSettingsGateway.ts`): `createAbstraction<IWorkflowSettingsGateway>("Workflows/WorkflowSettingsGateway")` with namespace `Interface`.
- **Implementation** (`[AWS]/gateway/WorkflowSettingsGatewayImpl.ts`): class `WorkflowSettingsGatewayImpl`, exported as `WorkflowSettingsGateway`, dependencies `[MainGraphQLClient]`. Documents `query GetWorkflowSettings($includeExpired: Boolean)` and `mutation UpdateWorkflowSettings($data: WorkflowsSettingsInput!)` on `workflows { … }`, each selecting `data { ${SETTINGS_FIELDS} } error { ${ERROR_FIELDS} }`. The variables are passed as given (`{ includeExpired }`, `{ data }`); the mutation document travels in `query` (A107, the CMS editor gateway's store mutation does the same). The envelope is returned as it is, also for a server error; a transport `Error` passes through (R204).
- **Mappers:** `mapWorkflowSettings(dto: WorkflowSettingsDto): WorkflowSettings` (absent and `null` `reason` / `endsOn` both map to `null`; order kept; new arrays and objects) and `toWorkflowSettingsDto(settings: WorkflowSettings): WorkflowSettingsDto` (`null` sent as `null`, which the server turns into an absent key; order kept; new arrays and objects).

**Files:**
- Create: `packages/app-workflows/src/settings/domain/types.ts`
- Create: `packages/app-workflows/src/settings/domain/SettingsErrorCode.ts`
- Create: `packages/app-workflows/src/settings/gateway/dto.ts`
- Create: `packages/app-workflows/src/settings/gateway/settingsFields.ts`
- Create: `packages/app-workflows/src/settings/gateway/IWorkflowSettingsGateway.ts`
- Create: `packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.ts`
- Create: `packages/app-workflows/src/settings/gateway/WorkflowSettingsGatewayImpl.ts`
- Create: `packages/app-workflows/src/settings/gateway/mapWorkflowSettings.ts`
- Create: `packages/app-workflows/src/settings/gateway/toWorkflowSettingsDto.ts`
- Create: `packages/app-workflows/src/settings/gateway/WorkflowSettingsGatewayImpl.test.ts`
- Create: `packages/app-workflows/src/settings/gateway/mapWorkflowSettings.test.ts`
- Create: `packages/app-workflows/src/settings/gateway/toWorkflowSettingsDto.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`, `execute<TResult>({ query, variables })`), `EditorEnvelope<T>` and `WorkflowsOperationResponse<TName, TEnvelope>` (`~/editor/gateway/dto.js`), `ERROR_FIELDS` (`~/review/gateway/reviewFields.js`, `code message data`), `createAbstraction` (`@webiny/feature/admin`), `Container` (`@webiny/di`). Server SDL (read only): `WorkflowsExclusion { userId: String! reason: String endsOn: DateTime }`, `WorkflowsSettings { exclusions: [WorkflowsExclusion!]! }`, `WorkflowsSettingsResponse { data error }`, `input WorkflowsExclusionInput { userId: String! reason: String endsOn: String }`, `input WorkflowsSettingsInput { exclusions: [WorkflowsExclusionInput!]! }`, `WorkflowsQuery.getSettings(includeExpired: Boolean)`, `WorkflowsMutation.updateSettings(data: WorkflowsSettingsInput!)`.
- Produces (matches the contract): `WorkflowExclusion`, `WorkflowSettings`, `SettingsErrorCode`, `WorkflowExclusionDto`, `WorkflowSettingsDto`, `SETTINGS_FIELDS`, `GetSettingsParams`, `IWorkflowSettingsGateway`, `WorkflowSettingsGateway` (token and implementation), `mapWorkflowSettings`, `toWorkflowSettingsDto`. Consumed by Task 3.

**Test runner note:** admin package, `yarn test <path>` only, one file per command. Test files import `describe`, `expect`, `it` (and `beforeEach`, `vi`) from `vitest`, one per line.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/gateway/WorkflowSettingsGatewayImpl.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { WorkflowSettingsDto } from "./dto.js";
import { SETTINGS_FIELDS } from "./settingsFields.js";
import { WorkflowSettingsGateway as GatewayAbstraction } from "./WorkflowSettingsGateway.js";
import { WorkflowSettingsGateway } from "./WorkflowSettingsGatewayImpl.js";

const SETTINGS: WorkflowSettingsDto = {
    exclusions: [
        { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" },
        { userId: "user-2", reason: null, endsOn: null }
    ]
};

describe("WorkflowSettingsGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WorkflowSettingsGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("sends nothing until a method is called", () => {
        expect(client.execute).not.toHaveBeenCalled();
    });

    it("reads the settings on the workflows root with includeExpired as the variable", async () => {
        const envelope = { data: SETTINGS, error: null };
        client.execute.mockResolvedValue({ workflows: { getSettings: envelope } });

        const result = await gateway.getSettings({ includeExpired: true });

        expect(result).toEqual(envelope);
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
        const envelope = { data: SETTINGS, error: null };
        client.execute.mockResolvedValue({ workflows: { updateSettings: envelope } });

        const result = await gateway.updateSettings(SETTINGS);

        expect(result).toEqual(envelope);
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

    it("returns a server error of a read as an envelope and does not throw (R204)", async () => {
        const error = {
            code: "Workflows/NotAuthorized",
            message: "You are not allowed to view the workflow settings.",
            data: { action: "view the workflow settings" }
        };
        client.execute.mockResolvedValue({ workflows: { getSettings: { data: null, error } } });

        const result = await gateway.getSettings({ includeExpired: true });

        expect(result).toEqual({ data: null, error });
    });

    it("returns a server error of a save as an envelope and does not throw (R204)", async () => {
        const error = {
            code: "Workflows/Settings/Validation",
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        };
        client.execute.mockResolvedValue({ workflows: { updateSettings: { data: null, error } } });

        const result = await gateway.updateSettings(SETTINGS);

        expect(result).toEqual({ data: null, error });
    });

    it("lets a transport failure of a read pass as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);

        await expect(gateway.getSettings({ includeExpired: true })).rejects.toBe(failure);
    });

    it("lets a transport failure of a save pass as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);

        await expect(gateway.updateSettings(SETTINGS)).rejects.toBe(failure);
    });
});
```

Create `packages/app-workflows/src/settings/gateway/mapWorkflowSettings.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowExclusionDto } from "./dto.js";
import type { WorkflowSettingsDto } from "./dto.js";
import { mapWorkflowSettings } from "./mapWorkflowSettings.js";

describe("mapWorkflowSettings (R317)", () => {
    it("maps every exclusion with its user id, reason and end date", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        };

        expect(mapWorkflowSettings(dto)).toEqual({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        });
    });

    it("keeps a null reason and a null end date as null", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const result = mapWorkflowSettings(dto);

        expect(result.exclusions[0]).toEqual({ userId: "user-1", reason: null, endsOn: null });
    });

    it("maps an absent reason and an absent end date to null", () => {
        const exclusion: WorkflowExclusionDto = { userId: "user-1", reason: null, endsOn: null };
        Reflect.deleteProperty(exclusion, "reason");
        Reflect.deleteProperty(exclusion, "endsOn");
        const dto: WorkflowSettingsDto = { exclusions: [exclusion] };

        const result = mapWorkflowSettings(dto);

        expect(result.exclusions[0].reason).toBeNull();
        expect(result.exclusions[0].endsOn).toBeNull();
    });

    it("keeps the order the server returned, expired entries included", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-c", reason: null, endsOn: "2020-01-01T00:00:00.000Z" },
                { userId: "user-a", reason: null, endsOn: null },
                { userId: "user-b", reason: "Busy", endsOn: null }
            ]
        };

        const ids = mapWorkflowSettings(dto).exclusions.map(exclusion => exclusion.userId);

        expect(ids).toEqual(["user-c", "user-a", "user-b"]);
    });

    it("maps an empty list to an empty list", () => {
        const dto: WorkflowSettingsDto = { exclusions: [] };

        expect(mapWorkflowSettings(dto)).toEqual({ exclusions: [] });
    });

    it("does not share the list or the entries of the DTO", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const result = mapWorkflowSettings(dto);

        expect(result.exclusions).not.toBe(dto.exclusions);
        expect(result.exclusions[0]).not.toBe(dto.exclusions[0]);
    });
});
```

Create `packages/app-workflows/src/settings/gateway/toWorkflowSettingsDto.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { toWorkflowSettingsDto } from "./toWorkflowSettingsDto.js";

describe("toWorkflowSettingsDto (R317)", () => {
    it("writes every exclusion with its user id, reason and end date", () => {
        const settings: WorkflowSettings = {
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        };

        expect(toWorkflowSettingsDto(settings)).toEqual({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        });
    });

    it("sends a null reason and a null end date as null, not as an absent key", () => {
        const settings: WorkflowSettings = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const entry = toWorkflowSettingsDto(settings).exclusions[0];

        expect(Object.keys(entry)).toEqual(["userId", "reason", "endsOn"]);
        expect(entry.reason).toBeNull();
        expect(entry.endsOn).toBeNull();
    });

    it("keeps the order of the list", () => {
        const settings: WorkflowSettings = {
            exclusions: [
                { userId: "user-b", reason: null, endsOn: null },
                { userId: "user-a", reason: null, endsOn: null }
            ]
        };

        const ids = toWorkflowSettingsDto(settings).exclusions.map(entry => entry.userId);

        expect(ids).toEqual(["user-b", "user-a"]);
    });

    it("writes an empty list as an empty list", () => {
        const settings: WorkflowSettings = { exclusions: [] };

        expect(toWorkflowSettingsDto(settings)).toEqual({ exclusions: [] });
    });

    it("does not share the list or the entries of the settings", () => {
        const settings: WorkflowSettings = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const dto = toWorkflowSettingsDto(settings);

        expect(dto.exclusions).not.toBe(settings.exclusions);
        expect(dto.exclusions[0]).not.toBe(settings.exclusions[0]);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/gateway/WorkflowSettingsGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/mapWorkflowSettings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/toWorkflowSettingsDto.test.ts 2>&1 | tail -30
```

Expected: each file fails to load with `Failed to resolve import "./WorkflowSettingsGatewayImpl.js"` (`"./settingsFields.js"`, `"./WorkflowSettingsGateway.js"`), `"./mapWorkflowSettings.js"` and `"./toWorkflowSettingsDto.js"` respectively; no test runs. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/domain/types.ts`:

```ts
/*
 * One person taken out of automatic assignment (spec 4.4, D105): one entry per user. `reason` is
 * shown only to people with Manage workflows or Reassign and operate; `endsOn` is the stored ISO
 * UTC instant the exclusion ends at (D43, D124), `null` for "until removed". An absent and a
 * `null` value from the server are both `null` here (R317).
 */
export interface WorkflowExclusion {
    userId: string;
    reason: string | null;
    endsOn: string | null;
}

// The tenant's workflow settings record; a save replaces it whole (D106).
export interface WorkflowSettings {
    exclusions: WorkflowExclusion[];
}
```

Create `packages/app-workflows/src/settings/domain/SettingsErrorCode.ts`:

```ts
// The codes `GraphQLOperationError.code` carries for the settings operations (R317).
export const SettingsErrorCode = {
    Validation: "Workflows/Settings/Validation",
    Persistence: "Workflows/Settings/Persistence",
    NotAuthorized: "Workflows/NotAuthorized",
    NotAuthenticated: "Workflows/NotAuthenticated"
} as const;
```

Create `packages/app-workflows/src/settings/gateway/dto.ts`:

```ts
// `WorkflowsExclusion` as selected, and `WorkflowsExclusionInput` as sent (R317).
export interface WorkflowExclusionDto {
    userId: string;
    reason: string | null;
    // The `DateTime` string as the server returned it, or the ISO UTC string sent.
    endsOn: string | null;
}

// `WorkflowsSettings` as selected, and `WorkflowsSettingsInput` as sent.
export interface WorkflowSettingsDto {
    exclusions: WorkflowExclusionDto[];
}
```

Create `packages/app-workflows/src/settings/gateway/settingsFields.ts`:

```ts
// The `WorkflowsSettings` selection of the settings page (R317).
export const SETTINGS_FIELDS = /* GraphQL */ `
    exclusions {
        userId
        reason
        endsOn
    }
`;
```

Create `packages/app-workflows/src/settings/gateway/IWorkflowSettingsGateway.ts`:

```ts
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { WorkflowSettingsDto } from "./dto.js";

export interface GetSettingsParams {
    // Also the entries whose end date has passed; the settings page always asks for them (R317).
    includeExpired: boolean;
}

/*
 * The settings operations on the shared `workflows` root (R317). Every method resolves with the
 * envelope, also for a server error, and rejects only on a transport failure (R204).
 */
export interface IWorkflowSettingsGateway {
    getSettings(params: GetSettingsParams): Promise<EditorEnvelope<WorkflowSettingsDto>>;
    updateSettings(data: WorkflowSettingsDto): Promise<EditorEnvelope<WorkflowSettingsDto>>;
}
```

Create `packages/app-workflows/src/settings/gateway/WorkflowSettingsGateway.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowSettingsGateway } from "./IWorkflowSettingsGateway.js";

export const WorkflowSettingsGateway = createAbstraction<IWorkflowSettingsGateway>(
    "Workflows/WorkflowSettingsGateway"
);

export namespace WorkflowSettingsGateway {
    export type Interface = IWorkflowSettingsGateway;
}
```

Create `packages/app-workflows/src/settings/gateway/WorkflowSettingsGatewayImpl.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { EditorEnvelope } from "~/editor/gateway/dto.js";
import type { WorkflowsOperationResponse } from "~/editor/gateway/dto.js";
import type { WorkflowSettingsDto } from "./dto.js";
import type { GetSettingsParams } from "./IWorkflowSettingsGateway.js";
import { WorkflowSettingsGateway as GatewayAbstraction } from "./WorkflowSettingsGateway.js";
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
 * document (A107).
 */
class WorkflowSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async getSettings(params: GetSettingsParams): Promise<EditorEnvelope<WorkflowSettingsDto>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"getSettings", EditorEnvelope<WorkflowSettingsDto>>
        >({
            query: GET_SETTINGS,
            variables: { includeExpired: params.includeExpired }
        });

        return response.workflows.getSettings;
    }

    async updateSettings(data: WorkflowSettingsDto): Promise<EditorEnvelope<WorkflowSettingsDto>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"updateSettings", EditorEnvelope<WorkflowSettingsDto>>
        >({
            query: UPDATE_SETTINGS,
            variables: { data }
        });

        return response.workflows.updateSettings;
    }
}

export const WorkflowSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: WorkflowSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

Create `packages/app-workflows/src/settings/gateway/mapWorkflowSettings.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { WorkflowExclusionDto } from "./dto.js";
import type { WorkflowSettingsDto } from "./dto.js";

const mapWorkflowExclusion = (dto: WorkflowExclusionDto): WorkflowExclusion => {
    return {
        userId: dto.userId,
        reason: dto.reason ?? null,
        endsOn: dto.endsOn ?? null
    };
};

// The settings record as the server returned it, in its order; absent and `null` values are `null` (R317).
export const mapWorkflowSettings = (dto: WorkflowSettingsDto): WorkflowSettings => {
    return {
        exclusions: dto.exclusions.map(mapWorkflowExclusion)
    };
};
```

Create `packages/app-workflows/src/settings/gateway/toWorkflowSettingsDto.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { WorkflowExclusionDto } from "./dto.js";
import type { WorkflowSettingsDto } from "./dto.js";

const toWorkflowExclusionDto = (exclusion: WorkflowExclusion): WorkflowExclusionDto => {
    return {
        userId: exclusion.userId,
        reason: exclusion.reason,
        endsOn: exclusion.endsOn
    };
};

/*
 * The `WorkflowsSettingsInput` of a save, in the list's order. A `null` reason or end date is sent
 * as `null`; the server turns it into an absent key (R317).
 */
export const toWorkflowSettingsDto = (settings: WorkflowSettings): WorkflowSettingsDto => {
    return {
        exclusions: settings.exclusions.map(toWorkflowExclusionDto)
    };
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/gateway/WorkflowSettingsGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/mapWorkflowSettings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/gateway/toWorkflowSettingsDto.test.ts 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

No existing file changes. Type-check the new files and tests:

```bash
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: no TypeScript errors (the build compiles every `src` file, the co-located tests included, R243).

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
git commit -m "feat(app-workflows): add the workflow settings gateway" -m "The settings area gets its domain types, error codes, DTOs and the gateway for getSettings and updateSettings on the shared workflows root, with the mappers in both directions." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No conflicts with the code.** The SDL names (`getSettings(includeExpired: Boolean)`, `updateSettings(data: WorkflowsSettingsInput!)`, `WorkflowsSettingsInput`, the `workflows` root on both `Query` and `Mutation`) were read in `[AWF]/graphql/WorkflowsSchemaFactory.ts:435-459, 553-580`; A107 holds (`CmsWorkflowEditorGatewayImpl` sends `STORE_CMS_ENTRY_WORKFLOW`, a mutation, in `query`).
- **Absent keys:** the DTO declares `reason` and `endsOn` as `string | null` (GraphQL always answers a selected nullable field with `null`); the mapper still reads `?? null` and a test deletes the keys, as `mapWorkflowUserList` tolerates a missing `teamIds`.
- **`SettingsErrorCode`** has no test of its own (the contract lists none); Task 3's use-case tests use `SettingsErrorCode.Validation` and `SettingsErrorCode.NotAuthorized`.
- Size: small.

## Review fixes (sub-phase review)

- No changes. Checked: every import path and export (`MainGraphQLClient`, `EditorEnvelope`, `WorkflowsOperationResponse`, `ERROR_FIELDS`, `createAbstraction`, `Container`) exists; the gateway follows `WorkflowConfigGatewayImpl` and its test; R317 and R204 are covered; code style (one import per line, comments end with a period, no multiline ternaries) holds; the commit has both trailer lines.
