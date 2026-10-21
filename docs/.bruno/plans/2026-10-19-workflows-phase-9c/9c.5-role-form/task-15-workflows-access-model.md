### Task 15: Workflows access model

R333, R316; Q60, Q68.5; D54, D162, D182; QBZ-77; design DS:103-135 (`research-spec.md` 4.6); Copy gap 1; Review Focus 5. Pure functions over the role's permission list, used by Task 16's element. Nothing here is rendered, registered or resolved through DI; no file outside `packages/app-workflows/src/domain/permissions/` changes. Read and write follow the server and the admin permission check (`getWorkflowsPermissionSet`: `*` and `workflows.*` are full access; otherwise any `workflows` entry's boolean `editor` / `reassign`), and the stored shapes of Q60.

- **Types:** `WorkflowsAccessLevel = "none" | "full" | "custom"`; `WorkflowsAccess { level; editor; reassign; locked }`. Full and No access always carry `editor: false` and `reassign: false` (the flags belong to Custom). `locked` is true only for a `*` entry.
- **Read (`readWorkflowsAccess`):**
  - A value that is not an array (the role form passes `field.value as any[]`, `PermissionsRenderer.tsx:17`) is No access.
  - Any `*` entry: Full, `locked: true` (the API key form is where it is seen, `ApiKeysPresenter.ts:212-214`; a full-access role hides the field, `RolesPresenter.ts:232-237`).
  - Else any `workflows.*` entry, whatever other keys it has (the legacy `editor: true`): Full, not locked.
  - Else any `workflows` entry: Custom, `editor` true when any such entry has `editor === true`, `reassign` likewise (Q68.5: an unrecognised shape is read by its flags; a string `"yes"` is false). An entry with no flags is still Custom (QBZ-77).
  - Else No access. Only the names `workflows` and `workflows.*` are owned; `workflows.read` or any other name is not read.
- **Write (`writeWorkflowsAccess`):** copies the list (a non-array starts from `[]`; the input is never mutated). A `locked` access returns the copy unchanged (nothing is written over `*`). Otherwise it removes every `workflows` and `workflows.*` entry, keeps every other entry in order (same objects), then: No access adds nothing; Full appends exactly `{ name: "workflows.*" }`; Custom appends one `workflows` entry that copies every key of the first existing `workflows` entry except `name`, `editor` and `reassign`, then sets `editor: true` / `reassign: true` only for ticked boxes. Custom with nothing ticked therefore writes `{ name: "workflows" }` (plus any kept keys), which reads back as Custom.
- **Level switch (`changeWorkflowsAccessLevel`):** the same level or a locked access comes back unchanged (same object). To Custom: from Full both ticked (the same access until narrowed), from No access nothing ticked. To Full or No access: no flags.
- **Note (`getWorkflowsAccessNote`):** No access, Full, Custom with nothing ticked and Custom with both ticked each have one R333 note; Custom with one box ticked has none (`null`). A locked Full shows the Full note.
- **Copy (`workflowsAccessCopy.ts`):** every R333 string of the group plus the Copy gap 1 fallback `Access level`, as one `as const` object:
  - `title`: `Workflows`; `description`: `Publishing workflows for Headless CMS and Website Builder` (design DS:114, R333).
  - `levelLabel`: `Access level` (Copy gap 1 fallback).
  - `noAccess`: `No access`; `fullAccess`: `Full access`; `custom`: `Custom`.
  - `editorLabel`: `Manage workflows`; `editorDescription`: `Create and edit workflows, manage reviewer exclusions, and use routing tools such as Test routing.`
  - `reassignLabel`: `Reassign and operate`; `reassignDescription`: `Reassign reviewers, restart failed automated steps, and cancel reviews requested by others.`
  - `noAccessNote`: `Can't build workflows or operate reviews. Can still review content as a member of a reviewing team.`
  - `fullAccessNote`: `Includes Manage workflows and Reassign and operate.`
  - `customNoneNote`: `With nothing selected, this role has the same access as No access.`
  - `customBothNote`: `Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't.`
  - `reviewingNote`: `Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it.`

**Files:**
- Create: `packages/app-workflows/src/domain/permissions/WorkflowsAccessLevel.ts`
- Create: `packages/app-workflows/src/domain/permissions/WorkflowsAccess.ts`
- Create: `packages/app-workflows/src/domain/permissions/workflowsAccessCopy.ts`
- Create: `packages/app-workflows/src/domain/permissions/readWorkflowsAccess.ts`
- Create: `packages/app-workflows/src/domain/permissions/writeWorkflowsAccess.ts`
- Create: `packages/app-workflows/src/domain/permissions/changeWorkflowsAccessLevel.ts`
- Create: `packages/app-workflows/src/domain/permissions/getWorkflowsAccessNote.ts`
- Test: `packages/app-workflows/src/domain/permissions/readWorkflowsAccess.test.ts`
- Test: `packages/app-workflows/src/domain/permissions/writeWorkflowsAccess.test.ts`
- Test: `packages/app-workflows/src/domain/permissions/changeWorkflowsAccessLevel.test.ts`
- Test: `packages/app-workflows/src/domain/permissions/getWorkflowsAccessNote.test.ts`

**Interfaces:**
- Consumes: `Permission` (type, `{ name: string; [key: string]: any }`), exported by `@webiny/app-admin` (verified: `packages/app-admin/src/permissions/types.ts:7-10`, re-exported by `packages/app-admin/src/permissions/index.ts` and `packages/app-admin/src/index.ts:37` `export * from "./permissions/index.js"`). Type-only import, so the tests do not load the app-admin barrel.
- Produces: `WorkflowsAccessLevel`, `WorkflowsAccess`, `readWorkflowsAccess(value: Permission[]): WorkflowsAccess`, `writeWorkflowsAccess(value: Permission[], access: WorkflowsAccess): Permission[]`, `changeWorkflowsAccessLevel(access: WorkflowsAccess, level: WorkflowsAccessLevel): WorkflowsAccess`, `getWorkflowsAccessNote(access: WorkflowsAccess): string | null`, `WORKFLOWS_ACCESS_COPY` (Task 16).

**Test runner note:** admin package, `yarn test <path>` only, one file per command. The tests are pure (no rendering).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/domain/permissions/readWorkflowsAccess.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Permission } from "@webiny/app-admin";
import { readWorkflowsAccess } from "./readWorkflowsAccess.js";

describe("readWorkflowsAccess (R333, Q60, Q68.5)", () => {
    it("reads an empty list as No access", () => {
        const access = readWorkflowsAccess([]);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it("reads a list without workflows entries as No access", () => {
        const access = readWorkflowsAccess([{ name: "cms.*" }, { name: "fm.file", rwd: "r" }]);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["an object", { name: "workflows.*" }]
    ])("reads a value that is not an array (%s) as No access", (_label, raw) => {
        const notAList = raw as unknown as Permission[];

        const access = readWorkflowsAccess(notAList);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it("reads a * entry (the API key form) as Full and locked", () => {
        const access = readWorkflowsAccess([{ name: "*" }]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: true });
    });

    it("keeps * locked when workflows entries sit next to it", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true },
            { name: "*" },
            { name: "workflows.*" }
        ]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: true });
    });

    it("reads { name: workflows.* } as Full", () => {
        const access = readWorkflowsAccess([{ name: "cms.*" }, { name: "workflows.*" }]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("reads the legacy { name: workflows.*, editor: true } as Full", () => {
        const access = readWorkflowsAccess([{ name: "workflows.*", editor: true }]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("reads workflows.* as Full even next to a workflows entry with flags", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true },
            { name: "workflows.*" }
        ]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("reads a workflows entry with nothing set as Custom with nothing ticked (QBZ-77)", () => {
        const access = readWorkflowsAccess([{ name: "workflows" }]);

        expect(access).toEqual({ level: "custom", editor: false, reassign: false, locked: false });
    });

    it("reads editor: true as Custom with Manage workflows ticked", () => {
        const access = readWorkflowsAccess([{ name: "workflows", editor: true }]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: false, locked: false });
    });

    it("reads reassign: true as Custom with Reassign and operate ticked", () => {
        const access = readWorkflowsAccess([{ name: "workflows", reassign: true }]);

        expect(access).toEqual({ level: "custom", editor: false, reassign: true, locked: false });
    });

    it("reads both flags as Custom with both ticked", () => {
        const access = readWorkflowsAccess([{ name: "workflows", editor: true, reassign: true }]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: true, locked: false });
    });

    it("reads string flags such as yes as not set (only true counts)", () => {
        const access = readWorkflowsAccess([{ name: "workflows", editor: "yes", reassign: "yes" }]);

        expect(access).toEqual({ level: "custom", editor: false, reassign: false, locked: false });
    });

    it("combines the flags of several workflows entries", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true },
            { name: "cms.*" },
            { name: "workflows", reassign: true }
        ]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: true, locked: false });
    });

    it("reads an unrecognised workflows entry by its flags (Q68.5)", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true, accessLevel: "full", teams: ["t1"] }
        ]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: false, locked: false });
    });

    it("does not own other workflows names such as workflows.read", () => {
        const access = readWorkflowsAccess([{ name: "workflows.read", editor: true }]);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });
});
```

Create `packages/app-workflows/src/domain/permissions/writeWorkflowsAccess.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Permission } from "@webiny/app-admin";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { readWorkflowsAccess } from "./readWorkflowsAccess.js";
import { writeWorkflowsAccess } from "./writeWorkflowsAccess.js";

const NONE: WorkflowsAccess = { level: "none", editor: false, reassign: false, locked: false };
const FULL: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: false };
const LOCKED: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: true };
const CUSTOM_NONE: WorkflowsAccess = {
    level: "custom",
    editor: false,
    reassign: false,
    locked: false
};
const CUSTOM_EDITOR: WorkflowsAccess = {
    level: "custom",
    editor: true,
    reassign: false,
    locked: false
};
const CUSTOM_REASSIGN: WorkflowsAccess = {
    level: "custom",
    editor: false,
    reassign: true,
    locked: false
};
const CUSTOM_BOTH: WorkflowsAccess = {
    level: "custom",
    editor: true,
    reassign: true,
    locked: false
};

describe("writeWorkflowsAccess (R333, Q60)", () => {
    it("writes exactly { name: workflows.* } for Full, appended after the other entries", () => {
        const cms: Permission = { name: "cms.*" };

        const result = writeWorkflowsAccess([cms], FULL);

        expect(result).toEqual([{ name: "cms.*" }, { name: "workflows.*" }]);
        const written = result[1];
        expect(Object.keys(written)).toEqual(["name"]);
    });

    it("drops the legacy editor: true when Full is written again", () => {
        const result = writeWorkflowsAccess(
            [{ name: "workflows.*", editor: true }, { name: "cms.*" }],
            FULL
        );

        expect(result).toEqual([{ name: "cms.*" }, { name: "workflows.*" }]);
    });

    it("replaces a Custom entry with the Full entry", () => {
        const result = writeWorkflowsAccess([{ name: "workflows", editor: true }], FULL);

        expect(result).toEqual([{ name: "workflows.*" }]);
    });

    it("removes every workflows and workflows.* entry for No access and keeps the others in order", () => {
        const cms: Permission = { name: "cms.*" };
        const files: Permission = { name: "fm.file", rwd: "r" };
        const value: Permission[] = [
            cms,
            { name: "workflows", editor: true },
            files,
            { name: "workflows.*" },
            { name: "workflows", reassign: true }
        ];

        const result = writeWorkflowsAccess(value, NONE);

        expect(result).toEqual([{ name: "cms.*" }, { name: "fm.file", rwd: "r" }]);
        expect(result[0]).toBe(cms);
        expect(result[1]).toBe(files);
    });

    it("writes Custom with both ticked as one workflows entry with both flags", () => {
        const result = writeWorkflowsAccess([{ name: "workflows.*" }], CUSTOM_BOTH);

        expect(result).toEqual([{ name: "workflows", editor: true, reassign: true }]);
    });

    it("writes only the ticked flag and no key for the unticked one", () => {
        const result = writeWorkflowsAccess(
            [{ name: "workflows", editor: true, reassign: true }],
            CUSTOM_EDITOR
        );

        expect(result).toEqual([{ name: "workflows", editor: true }]);
        const entry = result[0];
        expect("reassign" in entry).toBe(false);
    });

    it("writes Reassign and operate alone", () => {
        const result = writeWorkflowsAccess([], CUSTOM_REASSIGN);

        expect(result).toEqual([{ name: "workflows", reassign: true }]);
    });

    it("writes Custom with nothing ticked as exactly { name: workflows }", () => {
        const result = writeWorkflowsAccess([{ name: "cms.*" }], CUSTOM_NONE);

        expect(result).toEqual([{ name: "cms.*" }, { name: "workflows" }]);
        const entry = result[1];
        expect(Object.keys(entry)).toEqual(["name"]);
    });

    it("reads an empty Custom back as Custom with nothing ticked (QBZ-77)", () => {
        const written = writeWorkflowsAccess([], CUSTOM_NONE);

        const access = readWorkflowsAccess(written);

        expect(access).toEqual(CUSTOM_NONE);
    });

    it("reads every written level back as the same access", () => {
        const levels: WorkflowsAccess[] = [NONE, FULL, CUSTOM_EDITOR, CUSTOM_REASSIGN, CUSTOM_BOTH];

        for (const level of levels) {
            const written = writeWorkflowsAccess([{ name: "cms.*" }], level);
            const access = readWorkflowsAccess(written);

            expect(access).toEqual(level);
        }
    });

    it("keeps the other keys of the first workflows entry on Custom", () => {
        const value: Permission[] = [
            { name: "workflows", editor: true, reassign: true, teams: ["t1"] },
            { name: "workflows", other: 1 }
        ];

        const result = writeWorkflowsAccess(value, CUSTOM_EDITOR);

        expect(result).toEqual([{ name: "workflows", teams: ["t1"], editor: true }]);
    });

    it("removes string flags of the existing entry and writes booleans", () => {
        const result = writeWorkflowsAccess(
            [{ name: "workflows", editor: "yes", reassign: "no" }],
            CUSTOM_REASSIGN
        );

        expect(result).toEqual([{ name: "workflows", reassign: true }]);
    });

    it("does not copy the keys of a workflows.* entry into Custom", () => {
        const result = writeWorkflowsAccess([{ name: "workflows.*", editor: true }], CUSTOM_NONE);

        expect(result).toEqual([{ name: "workflows" }]);
    });

    it("keeps other workflows names such as workflows.read untouched", () => {
        const read: Permission = { name: "workflows.read", editor: true };

        const result = writeWorkflowsAccess([read, { name: "workflows" }], FULL);

        expect(result).toEqual([{ name: "workflows.read", editor: true }, { name: "workflows.*" }]);
        expect(result[0]).toBe(read);
    });

    it("keeps a * entry in place on a write that is not locked", () => {
        const result = writeWorkflowsAccess([{ name: "*" }, { name: "workflows.*" }], NONE);

        expect(result).toEqual([{ name: "*" }]);
    });

    it("writes nothing over a locked access: a copy of the list, unchanged", () => {
        const value: Permission[] = [{ name: "*" }, { name: "workflows", editor: true }];

        const result = writeWorkflowsAccess(value, LOCKED);

        expect(result).toEqual([{ name: "*" }, { name: "workflows", editor: true }]);
        expect(result).not.toBe(value);
    });

    it("starts from an empty list when the value is not an array", () => {
        const notAList = null as unknown as Permission[];

        const result = writeWorkflowsAccess(notAList, FULL);

        expect(result).toEqual([{ name: "workflows.*" }]);
    });

    it("never mutates the input list or its entries", () => {
        const value: Permission[] = [
            { name: "cms.*" },
            { name: "workflows", editor: true, teams: ["t1"] }
        ];
        const before = structuredClone(value);

        writeWorkflowsAccess(value, CUSTOM_REASSIGN);
        writeWorkflowsAccess(value, FULL);
        writeWorkflowsAccess(value, NONE);

        expect(value).toEqual(before);
    });
});
```

Create `packages/app-workflows/src/domain/permissions/changeWorkflowsAccessLevel.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { changeWorkflowsAccessLevel } from "./changeWorkflowsAccessLevel.js";

const NONE: WorkflowsAccess = { level: "none", editor: false, reassign: false, locked: false };
const FULL: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: false };
const LOCKED: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: true };
const CUSTOM_EDITOR: WorkflowsAccess = {
    level: "custom",
    editor: true,
    reassign: false,
    locked: false
};

describe("changeWorkflowsAccessLevel (R333)", () => {
    it("starts Custom from No access with nothing ticked", () => {
        const access = changeWorkflowsAccessLevel(NONE, "custom");

        expect(access).toEqual({ level: "custom", editor: false, reassign: false, locked: false });
    });

    it("starts Custom from Full with both ticked (the same access until narrowed)", () => {
        const access = changeWorkflowsAccessLevel(FULL, "custom");

        expect(access).toEqual({ level: "custom", editor: true, reassign: true, locked: false });
    });

    it("drops the flags when Custom becomes Full", () => {
        const access = changeWorkflowsAccessLevel(CUSTOM_EDITOR, "full");

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("drops the flags when Custom becomes No access", () => {
        const access = changeWorkflowsAccessLevel(CUSTOM_EDITOR, "none");

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it("switches No access to Full and Full to No access", () => {
        const full = changeWorkflowsAccessLevel(NONE, "full");
        const none = changeWorkflowsAccessLevel(FULL, "none");

        expect(full).toEqual(FULL);
        expect(none).toEqual(NONE);
    });

    it("returns the same access for the same level", () => {
        const access = changeWorkflowsAccessLevel(CUSTOM_EDITOR, "custom");

        expect(access).toBe(CUSTOM_EDITOR);
    });

    it("returns a locked access unchanged", () => {
        const access = changeWorkflowsAccessLevel(LOCKED, "custom");

        expect(access).toBe(LOCKED);
    });
});
```

Create `packages/app-workflows/src/domain/permissions/getWorkflowsAccessNote.test.ts` (literal strings, so the copy is pinned verbatim):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { getWorkflowsAccessNote } from "./getWorkflowsAccessNote.js";
import { WORKFLOWS_ACCESS_COPY } from "./workflowsAccessCopy.js";

const createAccess = (overrides: Partial<WorkflowsAccess>): WorkflowsAccess => {
    return { level: "custom", editor: false, reassign: false, locked: false, ...overrides };
};

describe("getWorkflowsAccessNote (R333, QBZ-77)", () => {
    it("explains No access", () => {
        const access = createAccess({ level: "none" });

        expect(getWorkflowsAccessNote(access)).toBe(
            "Can't build workflows or operate reviews. Can still review content as a member of a reviewing team."
        );
    });

    it("explains Full access, also when it is locked by *", () => {
        const full = createAccess({ level: "full" });
        const locked = createAccess({ level: "full", locked: true });

        expect(getWorkflowsAccessNote(full)).toBe(
            "Includes Manage workflows and Reassign and operate."
        );
        expect(getWorkflowsAccessNote(locked)).toBe(
            "Includes Manage workflows and Reassign and operate."
        );
    });

    it("explains Custom with nothing ticked", () => {
        const access = createAccess({});

        expect(getWorkflowsAccessNote(access)).toBe(
            "With nothing selected, this role has the same access as No access."
        );
    });

    it("explains Custom with both ticked", () => {
        const access = createAccess({ editor: true, reassign: true });

        expect(getWorkflowsAccessNote(access)).toBe(
            "Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't."
        );
    });

    it("has no note for Custom with one box ticked", () => {
        const editor = createAccess({ editor: true });
        const reassign = createAccess({ reassign: true });

        expect(getWorkflowsAccessNote(editor)).toBeNull();
        expect(getWorkflowsAccessNote(reassign)).toBeNull();
    });

    it("keeps the group copy verbatim (R333, Copy gap 1)", () => {
        expect(WORKFLOWS_ACCESS_COPY).toEqual({
            title: "Workflows",
            description: "Publishing workflows for Headless CMS and Website Builder",
            levelLabel: "Access level",
            noAccess: "No access",
            fullAccess: "Full access",
            custom: "Custom",
            editorLabel: "Manage workflows",
            editorDescription:
                "Create and edit workflows, manage reviewer exclusions, and use routing tools such as Test routing.",
            reassignLabel: "Reassign and operate",
            reassignDescription:
                "Reassign reviewers, restart failed automated steps, and cancel reviews requested by others.",
            noAccessNote:
                "Can't build workflows or operate reviews. Can still review content as a member of a reviewing team.",
            fullAccessNote: "Includes Manage workflows and Reassign and operate.",
            customNoneNote: "With nothing selected, this role has the same access as No access.",
            customBothNote:
                "Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't.",
            reviewingNote:
                "Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it."
        });
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/domain/permissions/readWorkflowsAccess.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/domain/permissions/writeWorkflowsAccess.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/domain/permissions/changeWorkflowsAccessLevel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/domain/permissions/getWorkflowsAccessNote.test.ts 2>&1 | tail -30
```

Expected: each file fails to load with `Failed to resolve import "./readWorkflowsAccess.js"` (respectively `./writeWorkflowsAccess.js`, `./changeWorkflowsAccessLevel.js`, `./getWorkflowsAccessNote.js` / `./workflowsAccessCopy.js`). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/domain/permissions/WorkflowsAccessLevel.ts`:

```ts
// The three access levels of the role form's Workflows group (R333, Q60).
export type WorkflowsAccessLevel = "none" | "full" | "custom";
```

Create `packages/app-workflows/src/domain/permissions/WorkflowsAccess.ts`:

```ts
import type { WorkflowsAccessLevel } from "./WorkflowsAccessLevel.js";

/*
 * What the role form's Workflows group shows (R333). `editor` and `reassign` are the Custom boxes
 * ("Manage workflows", "Reassign and operate"); Full and No access carry neither. `locked` is true
 * for a `*` entry, which the group shows as Full and never changes.
 */
export interface WorkflowsAccess {
    level: WorkflowsAccessLevel;
    editor: boolean;
    reassign: boolean;
    locked: boolean;
}
```

Create `packages/app-workflows/src/domain/permissions/workflowsAccessCopy.ts`:

```ts
// Copy of the role form's Workflows group (design DS:103-135, QBZ-77, R333; Copy gap 1 for `levelLabel`).
export const WORKFLOWS_ACCESS_COPY = {
    title: "Workflows",
    description: "Publishing workflows for Headless CMS and Website Builder",
    levelLabel: "Access level",
    noAccess: "No access",
    fullAccess: "Full access",
    custom: "Custom",
    editorLabel: "Manage workflows",
    editorDescription:
        "Create and edit workflows, manage reviewer exclusions, and use routing tools such as Test routing.",
    reassignLabel: "Reassign and operate",
    reassignDescription:
        "Reassign reviewers, restart failed automated steps, and cancel reviews requested by others.",
    noAccessNote:
        "Can't build workflows or operate reviews. Can still review content as a member of a reviewing team.",
    fullAccessNote: "Includes Manage workflows and Reassign and operate.",
    customNoneNote: "With nothing selected, this role has the same access as No access.",
    customBothNote:
        "Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't.",
    reviewingNote:
        "Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it."
} as const;
```

Create `packages/app-workflows/src/domain/permissions/readWorkflowsAccess.ts`:

```ts
import type { Permission } from "@webiny/app-admin";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";

const ANY_PERMISSION_NAME = "*";
const WORKFLOWS_FULL_ACCESS_NAME = "workflows.*";
const WORKFLOWS_PERMISSION_NAME = "workflows";

/*
 * Reads the Workflows access from a role's whole permission list (R333, Q60, Q68.5), the way the
 * server and `getWorkflowsPermissionSet` read it. `*` is full access the group cannot change (the
 * API key form shows it), so it reads as Full and locked. `workflows.*` reads as Full whatever other
 * keys it carries (the legacy `editor: true`). Otherwise every `workflows` entry adds its flags,
 * only `=== true` counting, and the level is Custom even with nothing set (QBZ-77). A value that is
 * not an array reads as No access. Pure.
 */
export const readWorkflowsAccess = (value: Permission[]): WorkflowsAccess => {
    if (!Array.isArray(value)) {
        return { level: "none", editor: false, reassign: false, locked: false };
    }

    const anyAccess = value.some(entry => entry.name === ANY_PERMISSION_NAME);
    if (anyAccess) {
        return { level: "full", editor: false, reassign: false, locked: true };
    }

    const fullAccess = value.some(entry => entry.name === WORKFLOWS_FULL_ACCESS_NAME);
    if (fullAccess) {
        return { level: "full", editor: false, reassign: false, locked: false };
    }

    const entries = value.filter(entry => entry.name === WORKFLOWS_PERMISSION_NAME);
    if (entries.length === 0) {
        return { level: "none", editor: false, reassign: false, locked: false };
    }

    const editor = entries.some(entry => entry.editor === true);
    const reassign = entries.some(entry => entry.reassign === true);

    return { level: "custom", editor, reassign, locked: false };
};
```

Create `packages/app-workflows/src/domain/permissions/writeWorkflowsAccess.ts`:

```ts
import type { Permission } from "@webiny/app-admin";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";

const WORKFLOWS_FULL_ACCESS_NAME = "workflows.*";
const WORKFLOWS_PERMISSION_NAME = "workflows";
const OWNED_KEYS = ["name", "editor", "reassign"];

const isOwnedEntry = (entry: Permission): boolean => {
    return entry.name === WORKFLOWS_PERMISSION_NAME || entry.name === WORKFLOWS_FULL_ACCESS_NAME;
};

/*
 * Writes the Workflows access into a role's permission list (R333, Q60). The group owns only the
 * `workflows` and `workflows.*` entries: they are removed, every other entry (also `*`) stays in
 * order, and the new entry is appended. Full is exactly `{ name: "workflows.*" }`. Custom is one
 * `workflows` entry that keeps every other key of the first existing `workflows` entry and carries
 * `editor: true` / `reassign: true` only for ticked boxes, so Custom with nothing ticked is
 * `{ name: "workflows" }` and reads back as Custom (QBZ-77). A locked access (`*`) writes nothing.
 * A value that is not an array starts from an empty list. The input is never mutated. Pure.
 */
export const writeWorkflowsAccess = (value: Permission[], access: WorkflowsAccess): Permission[] => {
    const current: Permission[] = [];
    if (Array.isArray(value)) {
        current.push(...value);
    }

    if (access.locked) {
        return current;
    }

    const existing = current.find(entry => entry.name === WORKFLOWS_PERMISSION_NAME);
    const result = current.filter(entry => !isOwnedEntry(entry));

    if (access.level === "none") {
        return result;
    }

    if (access.level === "full") {
        result.push({ name: WORKFLOWS_FULL_ACCESS_NAME });
        return result;
    }

    const entry: Permission = { name: WORKFLOWS_PERMISSION_NAME };
    if (existing) {
        for (const [key, item] of Object.entries(existing)) {
            if (!OWNED_KEYS.includes(key)) {
                entry[key] = item;
            }
        }
    }
    if (access.editor) {
        entry.editor = true;
    }
    if (access.reassign) {
        entry.reassign = true;
    }
    result.push(entry);

    return result;
};
```

Create `packages/app-workflows/src/domain/permissions/changeWorkflowsAccessLevel.ts`:

```ts
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import type { WorkflowsAccessLevel } from "./WorkflowsAccessLevel.js";

/*
 * The access after the admin picks another level (R333). Custom starts with nothing ticked from No
 * access and with both boxes ticked from Full (the same access until narrowed); Full and No access
 * carry no flags. The same level, or a locked access (`*`), comes back unchanged. Pure.
 */
export const changeWorkflowsAccessLevel = (
    access: WorkflowsAccess,
    level: WorkflowsAccessLevel
): WorkflowsAccess => {
    if (access.locked || access.level === level) {
        return access;
    }

    if (level === "custom") {
        const ticked = access.level === "full";
        return { level, editor: ticked, reassign: ticked, locked: false };
    }

    return { level, editor: false, reassign: false, locked: false };
};
```

Create `packages/app-workflows/src/domain/permissions/getWorkflowsAccessNote.ts`:

```ts
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { WORKFLOWS_ACCESS_COPY } from "./workflowsAccessCopy.js";

/*
 * The note under the level control (R333, QBZ-77): one per level, two for Custom (nothing ticked,
 * both ticked) and none for Custom with one box ticked. Pure.
 */
export const getWorkflowsAccessNote = (access: WorkflowsAccess): string | null => {
    if (access.level === "none") {
        return WORKFLOWS_ACCESS_COPY.noAccessNote;
    }
    if (access.level === "full") {
        return WORKFLOWS_ACCESS_COPY.fullAccessNote;
    }
    if (access.editor && access.reassign) {
        return WORKFLOWS_ACCESS_COPY.customBothNote;
    }
    if (!access.editor && !access.reassign) {
        return WORKFLOWS_ACCESS_COPY.customNoneNote;
    }
    return null;
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/domain/permissions/readWorkflowsAccess.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/domain/permissions/writeWorkflowsAccess.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/domain/permissions/changeWorkflowsAccessLevel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/domain/permissions/getWorkflowsAccessNote.test.ts 2>&1 | tail -30
```

Expected: PASS, every case. If `structuredClone` is missing in the test environment (it is a Node 17+ global, and jsdom keeps Node's globals), replace `structuredClone(value)` with `JSON.parse(JSON.stringify(value))` assigned to a typed `const before: Permission[]` and record it.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

Nothing existing imports the new files. Run the existing permission tests next door and the type checks:

```bash
yarn test packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors (the build type-checks the co-located tests, R243). `app.cleanup.test.tsx` still passes: `domain/permissionsSchema.ts` is untouched (Task 17 deletes it), and the new `domain/permissions/` folder is not in its lists yet (Task 17 adds it to `KEPT_PATHS`).

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
git checkout HEAD -- .gitleaks.toml
git commit -m "feat(app-workflows): add the workflows role access model" -m "Pure functions behind the role form's Workflows group: read the access from the permission list (* locked, workflows.* full, workflows entries custom by their boolean flags), write it back (full as exactly { name: \"workflows.*\" }, custom as one workflows entry that keeps its other keys), switch levels and pick the level note. Only the workflows and workflows.* entries are owned; every other entry keeps its place." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`WORKFLOWS_ACCESS_COPY` also holds the group's `title` and `description`.** The contract says the file holds "the R333 strings"; the title and description are R333 strings used by Task 16's `SecurityPermissions`, so they live here with the rest and Task 16 reads them from this object.
- **The owned-name constants (`workflows`, `workflows.*`, `*`) are unexported module constants in `readWorkflowsAccess.ts` and `writeWorkflowsAccess.ts`**, as `getWorkflowsPermissionSet.ts` keeps its own; the contract lists no constants file, and a shared one would be a file the contract does not name.
- **`writeWorkflowsAccess` with a `locked` access returns a copy of the list unchanged.** R333 says a `*` role writes nothing; the element never calls it while locked (Task 16), and this makes the function safe on its own.
- **`changeWorkflowsAccessLevel` returns the same object for the same level or a locked access**, so Task 16 can skip writing when the active segment is clicked again (no form dirtying, R333 "never on mount, only on a user action that changes the group").
- **A read Full or No access carries `editor: false` and `reassign: false`** ("to Full or No access drops the flags"); `getWorkflowsPermissionSet`'s `fullAccess ⇒ editor && reassign` is a permission check, not the form state.
- Size: small (seven tiny source files, four pure test files).

## Review fixes (sub-phase review)

- None. Checked against R333, Q60, Q68.5, Review Focus 5, the `Permission` type (`app-admin/src/permissions/types.ts:7-10`, exported from the package root) and the code-style rules; the code and tests stand as written.
