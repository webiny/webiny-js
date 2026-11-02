### Task 6: Shared `listUsers` gateway and use case

R286, R291, R307 (the `teamIds` scope that Task 14b's member search sends), D133, D170; Q49, A103; Review Focus 8, 10 (`00-shared.md`). The phase 9a Global Constraints and Rulings R202-R284 apply unchanged (read: the envelope contract R204, one public function per file, one named import per line, no inline object types, no nested call arguments, comments end with a period, targeted tests, the pre-commit chain, the editor-only gate).

The editor gets the `listUsers` lookup of the shared `workflows` root. Task 2 gave the server field the optional `teamIds` argument and the `WorkflowsListedUser { id displayName teamIds }` type; this task adds the admin side: a domain type, a DTO, a mapper, the gateway method and the use-case method, next to `listTeams`. Nothing calls it yet (Task 14, 14b and 14c do).

- **Domain** (`[AWE]/domain/types.ts`): `WorkflowUserSummary { id: string; displayName: string; teamIds: string[] }` and `WorkflowUserList { users: WorkflowUserSummary[]; missingIds: string[] }`, next to `WorkflowTeamSummary` and `WorkflowTeamList`.
- **DTO** (`[AWE]/gateway/dto.ts`): `WorkflowUserDto` and `WorkflowUserListDto`, the same shapes as the server selection.
- **Mapper** (`[AWE]/gateway/mapWorkflowUserList.ts`): copies the users and the missing ids; an absent `teamIds` maps to `[]` (the teams-off answer carries `[]` on every user, R286, and the mapper tolerates a missing key as `mapAiTool` tolerates a missing `changesContent`). It never invents a name and never reads anything else.
- **Fields fragment** (`[AWE]/gateway/editorFields.ts`): `EDITOR_USER_LIST_FIELDS` selects `users { id displayName teamIds }` and `missingIds` (ids, display name and team ids only, D104: no e-mail, roles or team names).
- **Gateway** (`IWorkflowConfigGateway.listUsers(params: ListUsersParams): Promise<EditorEnvelope<WorkflowUserListDto>>`, `ListUsersParams { search: string | null; ids: string[] | null; teamIds: string[] | null; limit: number | null }`): the document `workflows { listUsers(search: $search, ids: $ids, teamIds: $teamIds, limit: $limit) { data { ... } error { ... } } }` and the variables passed through as given (`null` stays `null`). The envelope is returned as it is, also for a server error (R204).
- **Use case** (`IWorkflowConfigUseCases.listUsers(params: ListUsersParams): Promise<WorkflowUserList>`): `envelope.error || !envelope.data` throws `toOperationError(envelope.error)`, otherwise the mapped list. A transport `Error` passes as it is. The class is bound once for both apps, as the other lookups.
- **Fixtures and fakes** (`[AWET]`): `createWorkflowUserSummary`, `createWorkflowUserDto`, `createWorkflowUserListDto` in `editorFixtures.ts`; `listUsers` on `createFakeConfigUseCases` (default `{ users: [], missingIds: [] }`).

**Files:**
- Modify: `packages/app-workflows/src/editor/domain/types.ts`
- Modify: `packages/app-workflows/src/editor/gateway/dto.ts`
- Create: `packages/app-workflows/src/editor/gateway/mapWorkflowUserList.ts`
- Create: `packages/app-workflows/src/editor/gateway/mapWorkflowUserList.test.ts`
- Modify: `packages/app-workflows/src/editor/gateway/editorFields.ts`
- Modify: `packages/app-workflows/src/editor/gateway/editorFields.test.ts`
- Modify: `packages/app-workflows/src/editor/gateway/IWorkflowConfigGateway.ts`
- Modify: `packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.ts`
- Modify: `packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.test.ts`
- Modify: `packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.ts`
- Modify: `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts`
- Modify: `packages/app-workflows/src/editor/testing/editorFixtures.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeWorkflowConfigUseCases.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `EditorEnvelope<T>`, `WorkflowsOperationResponse<TName, TEnvelope>` (`~/editor/gateway/dto.js`), `ERROR_FIELDS` (`~/review/gateway/reviewFields.js`), `toOperationError` (`~/editor/useCases/toOperationError.js`), `WorkflowConfigGateway` and `WorkflowConfigUseCases` tokens, the `listTeams` method of each as the template, `createWorkflowTeamSummary` (`editorFixtures.ts`). Server side (Task 2): `workflows { listUsers(search: String, ids: [String!], limit: Int, teamIds: [String!]): WorkflowsUserListResponse! }` whose `data` is `WorkflowsUserListResult { users: [WorkflowsListedUser!]!, missingIds: [String!]! }`.
- Produces (matches the contract): `WorkflowUserSummary`, `WorkflowUserList`, `ListUsersParams`, `IWorkflowConfigGateway.listUsers`, `IWorkflowConfigUseCases.listUsers(params: ListUsersParams): Promise<WorkflowUserList>`, `mapWorkflowUserList`, `EDITOR_USER_LIST_FIELDS`, the fixtures and the fake above. Consumed by Tasks 14, 14b, 14c and 19b.

**Test runner note:** admin package, `yarn test <path>` only. Test files import `describe`, `expect`, `it` from `vitest` one per line.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/editor/testing/editorFixtures.ts`: the fixtures the tests below import.

Before:

```ts
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { AiToolDto } from "~/editor/gateway/dto.js";
```

After:

```ts
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { AiToolDto } from "~/editor/gateway/dto.js";
```

Before:

```ts
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "~/editor/gateway/dto.js";
```

After:

```ts
import type { WorkflowModelPageDto } from "~/editor/gateway/dto.js";
import type { WorkflowModelRowDto } from "~/editor/gateway/dto.js";
import type { WorkflowUserDto } from "~/editor/gateway/dto.js";
import type { WorkflowUserListDto } from "~/editor/gateway/dto.js";
```

Before:

```ts
export const createAiModel = (overrides: Partial<AiModel> = {}): AiModel => {
```

After:

```ts
export const createWorkflowUserSummary = (
    overrides: Partial<WorkflowUserSummary> = {}
): WorkflowUserSummary => {
    return { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"], ...overrides };
};

export const createWorkflowUserDto = (overrides: Partial<WorkflowUserDto> = {}): WorkflowUserDto => {
    return { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"], ...overrides };
};

export const createWorkflowUserListDto = (
    overrides: Partial<WorkflowUserListDto> = {}
): WorkflowUserListDto => {
    return { users: [createWorkflowUserDto()], missingIds: [], ...overrides };
};

export const createAiModel = (overrides: Partial<AiModel> = {}): AiModel => {
```

Create `packages/app-workflows/src/editor/gateway/mapWorkflowUserList.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapWorkflowUserList } from "./mapWorkflowUserList.js";
import { createWorkflowUserDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserListDto } from "~/editor/testing/editorFixtures.js";

describe("mapWorkflowUserList", () => {
    it("maps every user with its id, display name and team ids and keeps the missing ids", () => {
        const dto = createWorkflowUserListDto({
            users: [
                createWorkflowUserDto({
                    id: "user-1",
                    displayName: "Ivan Horvat",
                    teamIds: ["team-1", "team-2"]
                }),
                createWorkflowUserDto({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
            ],
            missingIds: ["user-gone"]
        });

        expect(mapWorkflowUserList(dto)).toEqual({
            users: [
                { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1", "team-2"] },
                { id: "user-2", displayName: "Maja Kos", teamIds: [] }
            ],
            missingIds: ["user-gone"]
        });
    });

    it("keeps the order the server returned", () => {
        const dto = createWorkflowUserListDto({
            users: [
                createWorkflowUserDto({ id: "user-b", displayName: "Bea" }),
                createWorkflowUserDto({ id: "user-a", displayName: "Ana" })
            ]
        });

        const ids = mapWorkflowUserList(dto).users.map(user => user.id);

        expect(ids).toEqual(["user-b", "user-a"]);
    });

    it("maps an absent teamIds to an empty list", () => {
        const user = createWorkflowUserDto({ id: "user-1" });
        Reflect.deleteProperty(user, "teamIds");

        const dto = createWorkflowUserListDto({ users: [user] });

        const result = mapWorkflowUserList(dto);

        expect(result.users[0].teamIds).toEqual([]);
    });

    it("maps an empty answer to empty lists", () => {
        const dto = createWorkflowUserListDto({ users: [], missingIds: [] });

        const result = mapWorkflowUserList(dto);

        expect(result).toEqual({ users: [], missingIds: [] });
    });

    it("does not share the arrays of the DTO", () => {
        const dto = createWorkflowUserListDto({
            users: [createWorkflowUserDto({ teamIds: ["team-1"] })],
            missingIds: ["user-gone"]
        });

        const result = mapWorkflowUserList(dto);

        expect(result.users[0].teamIds).not.toBe(dto.users[0].teamIds);
        expect(result.missingIds).not.toBe(dto.missingIds);
    });
});
```

Modify `packages/app-workflows/src/editor/gateway/editorFields.test.ts`.

Before:

```ts
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "./editorFields.js";
```

After:

```ts
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { EDITOR_USER_LIST_FIELDS } from "./editorFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "./editorFields.js";
```

Before:

```ts
            EDITOR_TEAM_LIST_FIELDS,
            EDITOR_AI_MODEL_FIELDS,
```

After:

```ts
            EDITOR_TEAM_LIST_FIELDS,
            EDITOR_USER_LIST_FIELDS,
            EDITOR_AI_MODEL_FIELDS,
```

Before:

```ts
    it("selects exactly id, name and memberCount of a team and the missing ids (R268)", () => {
        expect(EDITOR_TEAM_LIST_FIELDS).toMatch(/teams\s*\{\s*id\s+name\s+memberCount\s*\}/);
        expect(words(EDITOR_TEAM_LIST_FIELDS)).toContain("missingIds");
    });
```

After:

```ts
    it("selects exactly id, name and memberCount of a team and the missing ids (R268)", () => {
        expect(EDITOR_TEAM_LIST_FIELDS).toMatch(/teams\s*\{\s*id\s+name\s+memberCount\s*\}/);
        expect(words(EDITOR_TEAM_LIST_FIELDS)).toContain("missingIds");
    });

    it("selects exactly id, displayName and teamIds of a user and the missing ids (R286)", () => {
        expect(EDITOR_USER_LIST_FIELDS).toMatch(/users\s*\{\s*id\s+displayName\s+teamIds\s*\}/);
        expect(words(EDITOR_USER_LIST_FIELDS)).toContain("missingIds");
        expect(words(EDITOR_USER_LIST_FIELDS)).not.toContain("email");
    });
```

Modify `packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.test.ts`.

Before:

```ts
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./WorkflowConfigGateway.js";
```

After:

```ts
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { EDITOR_USER_LIST_FIELDS } from "./editorFields.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./WorkflowConfigGateway.js";
```

Before:

```ts
    it("lists the AI models only when asked", async () => {
```

After:

```ts
    it("lists the users with search, ids, team ids and limit as variables", async () => {
        const envelope = {
            data: {
                users: [{ id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"] }],
                missingIds: ["user-9"]
            },
            error: null
        };
        client.execute.mockResolvedValue({ workflows: { listUsers: envelope } });

        const result = await gateway.listUsers({
            search: "iv",
            ids: ["user-1", "user-9"],
            teamIds: ["team-1"],
            limit: 20
        });

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            search: "iv",
            ids: ["user-1", "user-9"],
            teamIds: ["team-1"],
            limit: 20
        });
        expect(request.query).toContain("workflows");
        expect(request.query).toContain(
            "listUsers(search: $search, ids: $ids, teamIds: $teamIds, limit: $limit)"
        );
        expect(request.query).toContain(EDITOR_USER_LIST_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("sends null for every variable a user lookup does not set", async () => {
        client.execute.mockResolvedValue({
            workflows: { listUsers: { data: { users: [], missingIds: [] }, error: null } }
        });

        await gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: null, ids: null, teamIds: null, limit: null });
    });

    it("returns a server error of a user lookup as an envelope and does not throw (R204)", async () => {
        const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
        client.execute.mockResolvedValue({ workflows: { listUsers: { data: null, error } } });

        const result = await gateway.listUsers({
            search: null,
            ids: null,
            teamIds: null,
            limit: null
        });

        expect(result).toEqual({ data: null, error });
    });

    it("lets a transport failure of a user lookup pass as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);

        await expect(
            gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null })
        ).rejects.toBe(failure);
    });

    it("lists the AI models only when asked", async () => {
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts`.

Before:

```ts
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
```

After:

```ts
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
```

Before:

```ts
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

type FakeGateway
```

After:

```ts
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserListDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";

type FakeGateway
```

Before:

```ts
        listTeams: vi.fn(),
        listAiModels: vi.fn(),
        listAiTools: vi.fn()
    };
};

const teamParams: ListTeamsParams = { search: "ed", ids: null, limit: 20 };
```

After:

```ts
        listTeams: vi.fn(),
        listUsers: vi.fn(),
        listAiModels: vi.fn(),
        listAiTools: vi.fn()
    };
};

const teamParams: ListTeamsParams = { search: "ed", ids: null, limit: 20 };

const userParams: ListUsersParams = {
    search: "iv",
    ids: null,
    teamIds: ["team-1"],
    limit: 20
};
```

Before:

```ts
    { name: "listTeams", method: "listTeams", run: useCases => useCases.listTeams(teamParams) },
```

After:

```ts
    { name: "listTeams", method: "listTeams", run: useCases => useCases.listTeams(teamParams) },
    { name: "listUsers", method: "listUsers", run: useCases => useCases.listUsers(userParams) },
```

Before:

```ts
    it("lists the AI models as they are and the AI tools mapped with changesContent, only when called", async () => {
```

After:

```ts
    it("lists the users with the params passed through, the team ids and the missing ids", async () => {
        gateway.listUsers.mockResolvedValue({
            data: createWorkflowUserListDto({
                users: [
                    createWorkflowUserDto({ id: "user-1", teamIds: ["team-1", "team-2"] }),
                    createWorkflowUserDto({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
                ],
                missingIds: ["user-gone"]
            }),
            error: null
        });

        const result = await useCases.listUsers(userParams);

        expect(gateway.listUsers).toHaveBeenCalledWith(userParams);
        expect(result.users).toEqual([
            createWorkflowUserSummary({ id: "user-1", teamIds: ["team-1", "team-2"] }),
            createWorkflowUserSummary({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
        ]);
        expect(result.missingIds).toEqual(["user-gone"]);
    });

    it("lists the AI models as they are and the AI tools mapped with changesContent, only when called", async () => {
```

- [ ] **Step 2: Run the new tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/gateway/mapWorkflowUserList.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/editorFields.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts 2>&1 | tail -30
```

Expected: FAIL. The mapper test cannot resolve `./mapWorkflowUserList.js`, `editorFields.test.ts` reports `EDITOR_USER_LIST_FIELDS` as `undefined` (the new assertions fail on `toMatch`), the gateway test fails with `gateway.listUsers is not a function`, the use-case test with `useCases.listUsers is not a function`.

- [ ] **Step 3: Implementation**

Modify `packages/app-workflows/src/editor/domain/types.ts`.

Before:

```ts
export interface WorkflowTeamList {
    teams: WorkflowTeamSummary[];
    missingIds: string[];
}
```

After:

```ts
export interface WorkflowTeamList {
    teams: WorkflowTeamSummary[];
    missingIds: string[];
}

// A user as the editor lists one (D104): id, display name and the ids of the user's teams, no more.
export interface WorkflowUserSummary {
    id: string;
    displayName: string;
    // `[]` when the user has no team and always `[]` while teams are off (R286).
    teamIds: string[];
}

export interface WorkflowUserList {
    users: WorkflowUserSummary[];
    // The requested ids that no user has any more (D117).
    missingIds: string[];
}
```

Modify `packages/app-workflows/src/editor/gateway/dto.ts`.

Before:

```ts
export interface AiToolDto {
```

After:

```ts
export interface WorkflowUserDto {
    id: string;
    displayName: string;
    teamIds: string[];
}

export interface WorkflowUserListDto {
    users: WorkflowUserDto[];
    missingIds: string[];
}

export interface AiToolDto {
```

Create `packages/app-workflows/src/editor/gateway/mapWorkflowUserList.ts`:

```ts
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { WorkflowUserDto } from "./dto.js";
import type { WorkflowUserListDto } from "./dto.js";

const mapWorkflowUser = (dto: WorkflowUserDto): WorkflowUserSummary => {
    return {
        id: dto.id,
        displayName: dto.displayName,
        teamIds: [...(dto.teamIds ?? [])]
    };
};

export const mapWorkflowUserList = (dto: WorkflowUserListDto): WorkflowUserList => {
    return {
        users: dto.users.map(mapWorkflowUser),
        missingIds: [...dto.missingIds]
    };
};
```

Modify `packages/app-workflows/src/editor/gateway/editorFields.ts`.

Before:

```ts
export const EDITOR_AI_MODEL_FIELDS = /* GraphQL */ `
```

After:

```ts
// The `WorkflowsUserListResult` selection (R286): id, display name and team ids only (D104).
export const EDITOR_USER_LIST_FIELDS = /* GraphQL */ `
    users {
        id
        displayName
        teamIds
    }
    missingIds
`;

export const EDITOR_AI_MODEL_FIELDS = /* GraphQL */ `
```

Modify `packages/app-workflows/src/editor/gateway/IWorkflowConfigGateway.ts`.

Before:

```ts
import type { EditorStepTypeDto } from "./dto.js";
import type { AiModel } from "~/editor/domain/types.js";
```

After:

```ts
import type { EditorStepTypeDto } from "./dto.js";
import type { WorkflowUserListDto } from "./dto.js";
import type { AiModel } from "~/editor/domain/types.js";
```

Before:

```ts
/*
 * The editor's lookups on the shared `workflows` root.
```

After:

```ts
export interface ListUsersParams {
    search: string | null;
    // A lookup by id ignores `search`, `limit` and `teamIds` on the server (R286).
    ids: string[] | null;
    // Only users who are in any of these teams; `null` for every user.
    teamIds: string[] | null;
    limit: number | null;
}

/*
 * The editor's lookups on the shared `workflows` root.
```

Before:

```ts
    listTeams(params: ListTeamsParams): Promise<EditorEnvelope<WorkflowTeamList>>;
    listAiModels(): Promise<EditorEnvelope<AiModel[]>>;
```

After:

```ts
    listTeams(params: ListTeamsParams): Promise<EditorEnvelope<WorkflowTeamList>>;
    listUsers(params: ListUsersParams): Promise<EditorEnvelope<WorkflowUserListDto>>;
    listAiModels(): Promise<EditorEnvelope<AiModel[]>>;
```

Modify `packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.ts`.

Before:

```ts
import type { EditorStepTypeDto } from "./dto.js";
import type { WorkflowsOperationResponse } from "./dto.js";
import type { ListTeamsParams } from "./IWorkflowConfigGateway.js";
```

After:

```ts
import type { EditorStepTypeDto } from "./dto.js";
import type { WorkflowsOperationResponse } from "./dto.js";
import type { WorkflowUserListDto } from "./dto.js";
import type { ListTeamsParams } from "./IWorkflowConfigGateway.js";
import type { ListUsersParams } from "./IWorkflowConfigGateway.js";
```

Before:

```ts
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";

const LIST_STEP_TYPES
```

After:

```ts
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { EDITOR_USER_LIST_FIELDS } from "./editorFields.js";

const LIST_STEP_TYPES
```

Before:

```ts
const LIST_AI_MODELS = /* GraphQL */ `
```

After:

```ts
const LIST_USERS = /* GraphQL */ `
    query ListWorkflowUsers($search: String, $ids: [String!], $teamIds: [String!], $limit: Int) {
        workflows {
            listUsers(search: $search, ids: $ids, teamIds: $teamIds, limit: $limit) {
                data {
                    ${EDITOR_USER_LIST_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_AI_MODELS = /* GraphQL */ `
```

Before:

```ts
        return response.workflows.listTeams;
    }
```

After:

```ts
        return response.workflows.listTeams;
    }

    async listUsers(params: ListUsersParams): Promise<EditorEnvelope<WorkflowUserListDto>> {
        const response = await this.client.execute<
            WorkflowsOperationResponse<"listUsers", EditorEnvelope<WorkflowUserListDto>>
        >({
            query: LIST_USERS,
            variables: {
                search: params.search,
                ids: params.ids,
                teamIds: params.teamIds,
                limit: params.limit
            }
        });

        return response.workflows.listUsers;
    }
```

Modify `packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts`.

Before:

```ts
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
```

After:

```ts
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
```

Before:

```ts
import type { WorkflowTeamList } from "~/editor/domain/types.js";
```

After:

```ts
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
```

Before:

```ts
    listTeams(params: ListTeamsParams): Promise<WorkflowTeamList>;
```

After:

```ts
    listTeams(params: ListTeamsParams): Promise<WorkflowTeamList>;
    listUsers(params: ListUsersParams): Promise<WorkflowUserList>;
```

Modify `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.ts`.

Before:

```ts
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { mapAiTool } from "~/editor/gateway/mapAiTool.js";
import { mapAutomationDefinition } from "~/editor/gateway/mapAutomationDefinition.js";
import { mapEditorStepType } from "~/editor/gateway/mapEditorStepType.js";
```

After:

```ts
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { mapAiTool } from "~/editor/gateway/mapAiTool.js";
import { mapAutomationDefinition } from "~/editor/gateway/mapAutomationDefinition.js";
import { mapEditorStepType } from "~/editor/gateway/mapEditorStepType.js";
import { mapWorkflowUserList } from "~/editor/gateway/mapWorkflowUserList.js";
```

Before:

```ts
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import { WorkflowConfigUseCases as UseCasesAbstraction }
```

After:

```ts
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { WorkflowConfigUseCases as UseCasesAbstraction }
```

Before:

```ts
    public async listAiModels(): Promise<AiModel[]> {
```

After:

```ts
    public async listUsers(params: ListUsersParams): Promise<WorkflowUserList> {
        const envelope = await this.gateway.listUsers(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return mapWorkflowUserList(envelope.data);
    }

    public async listAiModels(): Promise<AiModel[]> {
```

Modify `packages/app-workflows/src/editor/testing/fakeWorkflowConfigUseCases.ts`.

Before:

```ts
    listTeams: Mock<IWorkflowConfigUseCases["listTeams"]>;
```

After:

```ts
    listTeams: Mock<IWorkflowConfigUseCases["listTeams"]>;
    listUsers: Mock<IWorkflowConfigUseCases["listUsers"]>;
```

Before:

```ts
 * config schema, no automation, the e-mail transport, no team, no AI model and no AI tool.
```

After:

```ts
 * config schema, no automation, the e-mail transport, no team, no user, no AI model and no AI tool.
```

Before:

```ts
        listTeams: vi.fn().mockResolvedValue({ teams: [], missingIds: [] }),
```

After:

```ts
        listTeams: vi.fn().mockResolvedValue({ teams: [], missingIds: [] }),
        listUsers: vi.fn().mockResolvedValue({ users: [], missingIds: [] }),
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/gateway/mapWorkflowUserList.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/editorFields.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/WorkflowConfigGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/useCases/WorkflowConfigUseCasesImpl.test.ts 2>&1 | tail -30
```

Expected: PASS. The `it.each(operationCases)` error-mapping cases now include `listUsers` (envelope error, neither data nor error, transport failure).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/gateway packages/app-workflows/src/editor/useCases 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors. The presenter tests build their config use cases with `createFakeConfigUseCases`, so the new method is covered by the fake. Any other object literal typed as `IWorkflowConfigUseCases` or `IWorkflowConfigGateway` outside the files above (found by `grep -rn "listAiTools: vi.fn" packages/`) gets `listUsers: vi.fn()`; none exists today beyond the use-case test's `createFakeGateway`.

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
git commit -m "feat(app-workflows): add the listUsers gateway and use case to the editor" -m "The shared config gateway and use cases get listUsers with search, ids, team ids and limit, a mapper that keeps the team ids of every user, and the fixtures and fake the presenters use." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Mapper and DTO files:** the contract lists `dto.ts` and `mapWorkflowUserList.ts`; the DTO types are `WorkflowUserDto` and `WorkflowUserListDto` (names not fixed by the contract). `editorFields.ts` and its test are also touched (`EDITOR_USER_LIST_FIELDS`), as the 9a team fragment `EDITOR_TEAM_LIST_FIELDS` lives there.
- **`teamIds` tolerance:** the server type is `[String!]!`, so the DTO declares `teamIds: string[]`; the mapper still reads `dto.teamIds ?? []` and a test deletes the key, because the type does not stop a stale server from omitting it.
- Size: small.

## Review fixes (sub-phase review)

- The Consumes entry named the envelope's `users` field directly; the real SDL (9b.2 Task 2) is `WorkflowsUserListResponse.data: WorkflowsUserListResult { users: [WorkflowsListedUser!]!, missingIds }`. Reworded. Admin names (`id displayName teamIds`, `teamIds` and `listUsers` argument order) match 9b.2's SDL.
- Two mapper tests passed a fixture call straight into the mapper call; each now names the DTO first (no nested call arguments).
