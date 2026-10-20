### Task 16: Role form element

R333, R341, R316; A109; Q60, Q68.5; D54, D162, D182; QBZ-75, QBZ-77; design DS:103-135 (`research-spec.md` 4.6, frames 12-14, 18, 19); Copy gap 1; Review Focus 5, 6. `SecurityPermissions` stops using the stock schema renderer and registers the custom element `WorkflowsRolePermissions` (the `CMSPermissions` pattern, `packages/app-headless-cms/src/admin/plugins/permissionRenderer/index.tsx` and `CmsPermissions.tsx`). The element is a thin controlled component over Task 15's pure functions: the permission list from `usePermissionValue()` is the state; there is no presenter and no `useState` (R333 overrides the presenter rule for this element, as the contract says).

- **Registration:** `Security.Permissions name="workflows" title="Workflows" description="Publishing workflows for Headless CMS and Website Builder" icon={<WorkflowsIcon />} element={<WorkflowsRolePermissions />}`; `WorkflowsIcon` is `@webiny/icons/account_tree.svg` (design DS:113). No `schema`, so `SecurityPermissions.tsx` no longer imports `WORKFLOWS_PERMISSIONS_SCHEMA` (Task 17 deletes that file). The base `Permissions` component renders the title, description and icon in its accordion header and the element as the body (`packages/app-admin/src/components/Permissions/Permissions.tsx`), inside the role form and the API key form alike. `presentation/permissions/index.tsx` is unchanged (`WorkflowsRolePermissions` is internal; Task 17 removes the two `HasWorkflowsEditorPermission` lines).
- **Layout (R333):**
  - The level control: admin-ui `SegmentedControl`, `label` `Access level` (Copy gap 1 fallback), items `No access` / `Full access` / `Custom` (values `none` / `full` / `custom`), `value` the read level, `disabled` when `locked`.
  - Custom only: two admin-ui `Checkbox`es, `Manage workflows` (`editor`) and `Reassign and operate` (`reassign`), each followed by its description as small muted text, linked to the box with `aria-describedby` (`Create and edit workflows, manage reviewer exclusions, and use routing tools such as Test routing.` / `Reassign reviewers, restart failed automated steps, and cancel reviews requested by others.`).
  - The level note from `getWorkflowsAccessNote` when not `null`.
  - Always the info note: icon `info` (decorative, `label=""` as in `ReviewBar.tsx:61`) and `Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it.` on a subtle background.
- **Writing:** `onChange` is called only from a user action that changes the group: picking another level (`changeWorkflowsAccessLevel` then `writeWorkflowsAccess`), or ticking / unticking a box (`{ ...access, editor: checked }` then `writeWorkflowsAccess`). Never on mount and never on re-render, so opening a role does not dirty the form and a legacy `{ name: "workflows.*", editor: true }` stays as it is until the admin changes the group (Q60). Clicking the active level writes nothing. While `locked` (a `*` entry) every control is disabled and nothing is written.
- **No `aacl` check** (Q60: workflows has its own licence): no `CannotUseAaclAlert`, no `useAuthentication`; the boxes are enabled for Custom without any identity.
- **A109 (R341):** two tests. `[AW]/app.test.tsx` mocks `SecurityPermissions` as a `data-testid="workflows-security-permissions"` div (it mocked it as `() => null` before) and asserts the group mounts with the flag on and not with the flag off, so with the flag off no Workflows group exists and the role's `workflows` entries pass through the form untouched. `WorkflowsRolePermissions.a109.test.tsx` renders the base `PermissionRenderer` (exported by `@webiny/app-admin`) for a foreign schema `createPermissionSchema({ prefix: "other", fullAccess: true })` next to `WorkflowsRolePermissions` in one `PermissionValueProvider` (as the role form does) and proves that changing the foreign level keeps `{ name: "workflows", reassign: true }` and `{ name: "workflows.*" }` unchanged, in place, and still shown by the Workflows group. **If either A109 test fails, stop and report (R341); do not change `app-admin`.**

**Files:**
- Create: `packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.tsx`
- Modify: `packages/app-workflows/src/presentation/permissions/SecurityPermissions.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Test: `packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.test.tsx`
- Test: `packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.a109.test.tsx`
- Test: `packages/app-workflows/src/presentation/permissions/SecurityPermissions.test.tsx`

**Interfaces:**
- Consumes: Task 15 (`readWorkflowsAccess`, `writeWorkflowsAccess`, `changeWorkflowsAccessLevel`, `getWorkflowsAccessNote`, `WORKFLOWS_ACCESS_COPY`, `WorkflowsAccess`, `WorkflowsAccessLevel` in `~/domain/permissions/`). Existing (verified by reading the source at BASE):
  - `@webiny/app-admin`: `usePermissionValue`, `PermissionValueProvider` (`packages/app-admin/src/permissions/PermissionValueContext.tsx`; the provider takes `value`, `onChange`, `children`; the hook throws outside a provider), `PermissionRenderer` (`permissions/PermissionRenderer.tsx`, prop `schema`; calls `useAuthentication()` and `usePermissionForm`), `createPermissionSchema`, type `Permission` (all re-exported by `permissions/index.ts` and `src/index.ts:37`), `AdminConfig` with `Security.Permissions` (`config/AdminConfig/SecurityPermissions.tsx`: `name`, `title`, `description?`, `icon?`, `system?` and either `schema` or `element`).
  - `@webiny/app-admin/config/AdminConfig.js`: `AdminWithConfig`, `AdminConfigPlugin`, `useAdminConfig` (`permissionRenderers: PermissionRendererConfig[]`), used the same way by `review/mounting/components/ReviewContentReviewsMenu.config.test.tsx`.
  - `useAuthentication` lives in `packages/app-admin/src/presentation/security/hooks/useAuthentication.ts`; `PermissionRenderer` reaches it through `~/exports/admin/security.js`, which re-exports that file.
  - `@webiny/admin-ui`: `SegmentedControl` (props `items: SegmentedControlItemParams[]`, `value`, `onChange(value: string)`, `disabled`, `label`; items are `button role="radio"` with `aria-checked`, `disabled` when the control is), `Checkbox` (props `id`, `label`, `checked`, `disabled`, `onChange(checked: boolean)` and Radix root attributes such as `aria-describedby`; renders `role="checkbox"` named by its label through `htmlFor`), `Text` (`as`, `size`, `className`, HTML attributes such as `id`), `Icon` (`icon`, `label`, `size`, `color`), type `SegmentedControlItemParams` (all exported from `packages/admin-ui/src/index.ts`).
  - `@webiny/icons/account_tree.svg` and `@webiny/icons/info.svg` exist in `packages/icons/dist`; in tests every `@webiny/icons/*.svg` is the `svg-icon` stub (`vitest.config.ts` alias).
  - `~/review/testing/renderWithAdminUi.js` (`renderWithAdminUi(ui): RenderResult`, R243), `@webiny/react-composition` `CompositionProvider` (devDependency).
- Produces: `WorkflowsRolePermissions` (no props), registered by `SecurityPermissions`; the `workflows-security-permissions` test id of the `app.test.tsx` mock.

**Test runner note:** admin package, `yarn test <path>` only, one file per command; `.tsx` tests import `React`. `setupDom.ts` already runs `cleanup` after each test.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.test.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { PermissionValueProvider } from "@webiny/app-admin";
import type { Permission } from "@webiny/app-admin";
import { WORKFLOWS_ACCESS_COPY } from "~/domain/permissions/workflowsAccessCopy.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { WorkflowsRolePermissions } from "./WorkflowsRolePermissions.js";

type ChangeSpy = Mock<(value: Permission[]) => void>;

interface HarnessProps {
    initial: Permission[];
    onChange: (value: Permission[]) => void;
}

// The role form keeps the list in its form state; the harness does the same with React state.
const Harness = ({ initial, onChange }: HarnessProps) => {
    const [value, setValue] = useState<Permission[]>(initial);
    const change = (next: Permission[]): void => {
        onChange(next);
        setValue(next);
    };

    return (
        <PermissionValueProvider value={value} onChange={change}>
            <WorkflowsRolePermissions />
        </PermissionValueProvider>
    );
};

const renderGroup = (initial: Permission[]): ChangeSpy => {
    const onChange: ChangeSpy = vi.fn();
    renderWithAdminUi(<Harness initial={initial} onChange={onChange} />);
    return onChange;
};

const getLastValue = (onChange: ChangeSpy): Permission[] => {
    const call = onChange.mock.lastCall;
    if (!call) {
        throw new Error("onChange was not called.");
    }
    return call[0];
};

const isChecked = (element: HTMLElement): boolean => {
    return element.getAttribute("aria-checked") === "true";
};

const LEVEL_NOTES = [
    WORKFLOWS_ACCESS_COPY.noAccessNote,
    WORKFLOWS_ACCESS_COPY.fullAccessNote,
    WORKFLOWS_ACCESS_COPY.customNoneNote,
    WORKFLOWS_ACCESS_COPY.customBothNote
];

const AACL_ALERT_TITLE = "Advanced Access Control Layer (AACL) not activated";

describe("WorkflowsRolePermissions (R333)", () => {
    it("shows the labelled level control, No access, its note and the reviewing note for a role without workflows entries", () => {
        const onChange = renderGroup([{ name: "cms.*" }]);

        expect(screen.getByText("Access level")).toBeDefined();
        const none = screen.getByRole("radio", { name: "No access" });
        const full = screen.getByRole("radio", { name: "Full access" });
        const custom = screen.getByRole("radio", { name: "Custom" });
        expect(isChecked(none)).toBe(true);
        expect(isChecked(full)).toBe(false);
        expect(isChecked(custom)).toBe(false);
        expect(
            screen.getByText(
                "Can't build workflows or operate reviews. Can still review content as a member of a reviewing team."
            )
        ).toBeDefined();
        expect(
            screen.getByText(
                "Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it."
            )
        ).toBeDefined();
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("writes exactly { name: workflows.* } after the other entries for Full access", () => {
        const onChange = renderGroup([{ name: "cms.*" }]);

        fireEvent.click(screen.getByRole("radio", { name: "Full access" }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getLastValue(onChange)).toEqual([{ name: "cms.*" }, { name: "workflows.*" }]);
        const full = screen.getByRole("radio", { name: "Full access" });
        expect(isChecked(full)).toBe(true);
        expect(
            screen.getByText("Includes Manage workflows and Reassign and operate.")
        ).toBeDefined();
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });

    it("writes { name: workflows } for Custom from No access, with nothing ticked and the same-as-No-access note", () => {
        const onChange = renderGroup([]);

        fireEvent.click(screen.getByRole("radio", { name: "Custom" }));

        expect(getLastValue(onChange)).toEqual([{ name: "workflows" }]);
        const editor = screen.getByRole("checkbox", { name: "Manage workflows" });
        const reassign = screen.getByRole("checkbox", { name: "Reassign and operate" });
        expect(isChecked(editor)).toBe(false);
        expect(isChecked(reassign)).toBe(false);
        expect(
            screen.getByText("With nothing selected, this role has the same access as No access.")
        ).toBeDefined();
    });

    it("starts Custom from Full with both boxes ticked and the same-as-Full note", () => {
        const onChange = renderGroup([{ name: "workflows.*" }]);

        fireEvent.click(screen.getByRole("radio", { name: "Custom" }));

        expect(getLastValue(onChange)).toEqual([
            { name: "workflows", editor: true, reassign: true }
        ]);
        const editor = screen.getByRole("checkbox", { name: "Manage workflows" });
        const reassign = screen.getByRole("checkbox", { name: "Reassign and operate" });
        expect(isChecked(editor)).toBe(true);
        expect(isChecked(reassign)).toBe(true);
        expect(
            screen.getByText(
                "Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't."
            )
        ).toBeDefined();
    });

    it("ticks Manage workflows and shows no level note with one box ticked", () => {
        const onChange = renderGroup([{ name: "workflows" }, { name: "fm.*" }]);

        fireEvent.click(screen.getByRole("checkbox", { name: "Manage workflows" }));

        expect(getLastValue(onChange)).toEqual([
            { name: "fm.*" },
            { name: "workflows", editor: true }
        ]);
        const editor = screen.getByRole("checkbox", { name: "Manage workflows" });
        expect(isChecked(editor)).toBe(true);
        for (const note of LEVEL_NOTES) {
            expect(screen.queryByText(note)).toBeNull();
        }
    });

    it("unticks Reassign and operate and removes its key", () => {
        const onChange = renderGroup([{ name: "workflows", editor: true, reassign: true }]);

        fireEvent.click(screen.getByRole("checkbox", { name: "Reassign and operate" }));

        const value = getLastValue(onChange);
        expect(value).toEqual([{ name: "workflows", editor: true }]);
        const entry = value[0];
        expect("reassign" in entry).toBe(false);
    });

    it("keeps the other keys of the workflows entry on Custom (Q68.5)", () => {
        const onChange = renderGroup([{ name: "workflows", editor: true, teams: ["t1"] }]);

        fireEvent.click(screen.getByRole("checkbox", { name: "Reassign and operate" }));

        expect(getLastValue(onChange)).toEqual([
            { name: "workflows", teams: ["t1"], editor: true, reassign: true }
        ]);
    });

    it("removes the workflows entries for No access and keeps the other entries in order", () => {
        const onChange = renderGroup([
            { name: "cms.*" },
            { name: "workflows", reassign: true },
            { name: "fm.*" }
        ]);

        fireEvent.click(screen.getByRole("radio", { name: "No access" }));

        expect(getLastValue(onChange)).toEqual([{ name: "cms.*" }, { name: "fm.*" }]);
    });

    it("links each box to its description", () => {
        renderGroup([{ name: "workflows" }]);

        const editor = screen.getByRole("checkbox", { name: "Manage workflows" });
        const reassign = screen.getByRole("checkbox", { name: "Reassign and operate" });
        const editorDescription = screen.getByText(
            "Create and edit workflows, manage reviewer exclusions, and use routing tools such as Test routing."
        );
        const reassignDescription = screen.getByText(
            "Reassign reviewers, restart failed automated steps, and cancel reviews requested by others."
        );
        expect(editorDescription.id).not.toBe("");
        expect(reassignDescription.id).not.toBe("");
        expect(editor.getAttribute("aria-describedby")).toBe(editorDescription.id);
        expect(reassign.getAttribute("aria-describedby")).toBe(reassignDescription.id);
    });

    it("reads a legacy { name: workflows.*, editor: true } as Full and rewrites it only when the level changes", () => {
        const onChange = renderGroup([{ name: "workflows.*", editor: true }]);

        const full = screen.getByRole("radio", { name: "Full access" });
        expect(isChecked(full)).toBe(true);
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.click(full);

        expect(onChange).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("radio", { name: "Custom" }));

        expect(getLastValue(onChange)).toEqual([
            { name: "workflows", editor: true, reassign: true }
        ]);
    });

    it("does not write when the active Custom level is clicked again", () => {
        const onChange = renderGroup([{ name: "workflows", reassign: true }]);

        fireEvent.click(screen.getByRole("radio", { name: "Custom" }));

        expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
        ["an empty list", []],
        ["Full", [{ name: "workflows.*" }]],
        ["the legacy Full", [{ name: "workflows.*", editor: true }]],
        ["Custom", [{ name: "workflows", editor: true }]],
        ["Custom with nothing set", [{ name: "workflows" }]],
        ["an unrecognised entry", [{ name: "workflows", editor: "yes", level: "x" }]],
        ["*", [{ name: "*" }]]
    ])("never calls onChange on mount (%s)", (_label, initial) => {
        const value: Permission[] = initial;

        const onChange = renderGroup(value);

        expect(onChange).not.toHaveBeenCalled();
    });

    it("shows a * entry as Full and locked: every control disabled and nothing written", () => {
        const onChange = renderGroup([{ name: "*" }]);

        const none = screen.getByRole("radio", { name: "No access" });
        const full = screen.getByRole("radio", { name: "Full access" });
        const custom = screen.getByRole("radio", { name: "Custom" });
        expect(isChecked(full)).toBe(true);
        expect(none.hasAttribute("disabled")).toBe(true);
        expect(full.hasAttribute("disabled")).toBe(true);
        expect(custom.hasAttribute("disabled")).toBe(true);

        fireEvent.click(custom);
        fireEvent.click(none);

        expect(onChange).not.toHaveBeenCalled();
        expect(
            screen.getByText("Includes Manage workflows and Reassign and operate.")
        ).toBeDefined();
    });

    it("reads a value that is not an array as No access and writes from an empty list", () => {
        const notAList = null as unknown as Permission[];
        const onChange = renderGroup(notAList);

        const none = screen.getByRole("radio", { name: "No access" });
        expect(isChecked(none)).toBe(true);

        fireEvent.click(screen.getByRole("radio", { name: "Full access" }));

        expect(getLastValue(onChange)).toEqual([{ name: "workflows.*" }]);
    });

    it("needs no aacl licence: no AACL alert and the boxes are enabled without any identity", () => {
        const onChange = renderGroup([{ name: "workflows", editor: true }]);

        const editor = screen.getByRole("checkbox", { name: "Manage workflows" });
        const reassign = screen.getByRole("checkbox", { name: "Reassign and operate" });
        expect(editor.hasAttribute("disabled")).toBe(false);
        expect(reassign.hasAttribute("disabled")).toBe(false);
        expect(screen.queryByText(AACL_ALERT_TITLE)).toBeNull();

        fireEvent.click(reassign);

        expect(getLastValue(onChange)).toEqual([
            { name: "workflows", editor: true, reassign: true }
        ]);
    });
});
```

Create `packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.a109.test.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { PermissionRenderer } from "@webiny/app-admin";
import { PermissionValueProvider } from "@webiny/app-admin";
import { createPermissionSchema } from "@webiny/app-admin";
import type { Permission } from "@webiny/app-admin";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { WorkflowsRolePermissions } from "./WorkflowsRolePermissions.js";

/*
 * `PermissionRenderer` asks `useAuthentication()` for the `aacl` permission. The hook needs the
 * login features in a DI container, which this test does not build, so the hook's module is
 * replaced by an identity without permissions (the schema below has no Custom level, so `aacl`
 * does not matter).
 */
vi.mock("@webiny/app-admin/presentation/security/hooks/useAuthentication.js", () => {
    const identity = {
        getPermission: () => {
            return null;
        }
    };
    return {
        useAuthentication: () => {
            return {
                identity,
                isAuthenticated: true,
                login: async () => undefined,
                logout: async () => undefined
            };
        }
    };
});

type ChangeSpy = Mock<(value: Permission[]) => void>;

const OTHER_SCHEMA = createPermissionSchema({ prefix: "other", fullAccess: true });

interface RoleFormHarnessProps {
    initial: Permission[];
    onChange: (value: Permission[]) => void;
}

/*
 * Two permission groups over one list, as the role form renders them (`Permissions.tsx`): a foreign
 * schema group and the Workflows element. The `form` element makes the Radix select render its
 * hidden native select, which the test drives.
 */
const RoleFormHarness = ({ initial, onChange }: RoleFormHarnessProps) => {
    const [value, setValue] = useState<Permission[]>(initial);
    const change = (next: Permission[]): void => {
        onChange(next);
        setValue(next);
    };

    return (
        <form>
            <PermissionValueProvider value={value} onChange={change}>
                <PermissionRenderer schema={OTHER_SCHEMA} />
                <WorkflowsRolePermissions />
            </PermissionValueProvider>
        </form>
    );
};

const getLastValue = (onChange: ChangeSpy): Permission[] => {
    const call = onChange.mock.lastCall;
    if (!call) {
        throw new Error("onChange was not called.");
    }
    return call[0];
};

const isChecked = (element: HTMLElement): boolean => {
    return element.getAttribute("aria-checked") === "true";
};

const selectOtherLevel = async (container: HTMLElement, level: string): Promise<void> => {
    await vi.waitFor(() => {
        const option = container.querySelector(`select option[value="${level}"]`);
        expect(option).not.toBeNull();
    });
    const select = container.querySelector("select");
    if (!select) {
        throw new Error("The foreign group's access level select is not rendered.");
    }
    fireEvent.change(select, { target: { value: level } });
};

const assertWorkflowsEntryKept = async (
    workflowsEntry: Permission,
    workflowsLevel: string
): Promise<void> => {
    const onChange: ChangeSpy = vi.fn();
    const cms: Permission = { name: "cms.*" };
    const initial: Permission[] = [cms, workflowsEntry];
    const { container } = renderWithAdminUi(
        <RoleFormHarness initial={initial} onChange={onChange} />
    );

    const before = screen.getByRole("radio", { name: workflowsLevel });
    expect(isChecked(before)).toBe(true);

    await selectOtherLevel(container, "full");
    await vi.waitFor(() => {
        expect(getLastValue(onChange)).toEqual([cms, workflowsEntry, { name: "other.*" }]);
    });

    await selectOtherLevel(container, "no");
    await vi.waitFor(() => {
        expect(getLastValue(onChange)).toEqual([cms, workflowsEntry]);
    });

    for (const call of onChange.mock.calls) {
        const value = call[0];
        const workflowsEntries = value.filter(entry => entry.name.startsWith("workflows"));
        expect(workflowsEntries).toEqual([workflowsEntry]);
        expect(value.indexOf(workflowsEntries[0])).toBe(1);
    }
    const after = screen.getByRole("radio", { name: workflowsLevel });
    expect(isChecked(after)).toBe(true);
};

describe("WorkflowsRolePermissions next to another permission group (A109, R341)", () => {
    it("keeps { name: workflows, reassign: true } unchanged when another group changes its level", async () => {
        await assertWorkflowsEntryKept({ name: "workflows", reassign: true }, "Custom");

        const reassign = screen.getByRole("checkbox", { name: "Reassign and operate" });
        expect(isChecked(reassign)).toBe(true);
    });

    it("keeps { name: workflows.* } unchanged when another group changes its level", async () => {
        await assertWorkflowsEntryKept({ name: "workflows.*" }, "Full access");
    });
});
```

Create `packages/app-workflows/src/presentation/permissions/SecurityPermissions.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { PermissionValueProvider } from "@webiny/app-admin";
import type { Permission } from "@webiny/app-admin";
import { CompositionProvider } from "@webiny/react-composition";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { SecurityPermissions } from "./SecurityPermissions.js";

const onChange = vi.fn<(value: Permission[]) => void>();

// Reads the registered permission groups back from the real admin config and renders each element.
const Probe = () => {
    const { permissionRenderers } = useAdminConfig();

    return (
        <>
            {permissionRenderers.map(renderer => (
                <section
                    key={renderer.name}
                    data-testid={`permission-renderer-${renderer.name}`}
                    data-title={renderer.title}
                    data-description={renderer.description ?? ""}
                    data-has-schema={String(renderer.schema !== undefined)}
                    data-has-icon={String(renderer.icon !== undefined)}
                >
                    <PermissionValueProvider value={[]} onChange={onChange}>
                        {renderer.element}
                    </PermissionValueProvider>
                </section>
            ))}
        </>
    );
};

describe("SecurityPermissions (R333)", () => {
    it("registers the Workflows group with its element, title, description and icon, and no schema", async () => {
        renderWithAdminUi(
            <CompositionProvider>
                <SecurityPermissions />
                <AdminWithConfig>
                    {AdminConfigPlugin}
                    <Probe />
                </AdminWithConfig>
            </CompositionProvider>
        );

        const group = await screen.findByTestId("permission-renderer-workflows");
        expect(group.getAttribute("data-title")).toBe("Workflows");
        expect(group.getAttribute("data-description")).toBe(
            "Publishing workflows for Headless CMS and Website Builder"
        );
        expect(group.getAttribute("data-has-schema")).toBe("false");
        expect(group.getAttribute("data-has-icon")).toBe("true");
        const none = within(group).getByRole("radio", { name: "No access" });
        expect(none.getAttribute("aria-checked")).toBe("true");
        expect(
            within(group).getByText(
                "Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it."
            )
        ).toBeDefined();
        expect(onChange).not.toHaveBeenCalled();
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Replace the `SecurityPermissions` mock (the block is unchanged by Tasks 3-13; apply the hunk to the file as they leave it):

```ts
// before
vi.mock("~/presentation/permissions/index.js", async importOriginal => {
    const actual = await importOriginal<typeof import("~/presentation/permissions/index.js")>();
    return { ...actual, SecurityPermissions: () => null };
});
```

```ts
// after
vi.mock("~/presentation/permissions/index.js", async importOriginal => {
    const actual = await importOriginal<typeof import("~/presentation/permissions/index.js")>();
    const react = await import("react");
    return {
        ...actual,
        SecurityPermissions: () => {
            return react.createElement("div", { "data-testid": "workflows-security-permissions" });
        }
    };
});
```

and append this block at the end of the file, after the last `describe` (whatever Tasks 3-13 added before it):

```ts
describe("WorkflowsAdminApp role form permissions (A109, R341)", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("mounts the Workflows permission group when the flag is on", () => {
        mount(true);

        expect(screen.getByTestId("workflows-security-permissions")).toBeDefined();
    });

    it("mounts no Workflows permission group when the flag is off, so the role's workflows entries pass through untouched", () => {
        mount(false);

        expect(screen.queryByTestId("workflows-security-permissions")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.a109.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/SecurityPermissions.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: `WorkflowsRolePermissions.test.tsx` and `WorkflowsRolePermissions.a109.test.tsx` fail to load with `Failed to resolve import "./WorkflowsRolePermissions.js"`. `SecurityPermissions.test.tsx` fails: `data-description` is `Manage Workflows permissions.` and `data-has-schema` is `true` (the stock schema renderer registers no element, so no radio is found either). `app.test.tsx` passes, including the two new cases: they pin the existing flag gate of `SecurityPermissions` (A109 is an assumption check, not new behaviour); record that. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.tsx`:

```tsx
import React from "react";
import { Checkbox } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { SegmentedControlItemParams } from "@webiny/admin-ui";
import { usePermissionValue } from "@webiny/app-admin";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { changeWorkflowsAccessLevel } from "~/domain/permissions/changeWorkflowsAccessLevel.js";
import { getWorkflowsAccessNote } from "~/domain/permissions/getWorkflowsAccessNote.js";
import { readWorkflowsAccess } from "~/domain/permissions/readWorkflowsAccess.js";
import { writeWorkflowsAccess } from "~/domain/permissions/writeWorkflowsAccess.js";
import { WORKFLOWS_ACCESS_COPY } from "~/domain/permissions/workflowsAccessCopy.js";
import type { WorkflowsAccess } from "~/domain/permissions/WorkflowsAccess.js";
import type { WorkflowsAccessLevel } from "~/domain/permissions/WorkflowsAccessLevel.js";

const LEVEL_ITEMS: SegmentedControlItemParams[] = [
    { value: "none", label: WORKFLOWS_ACCESS_COPY.noAccess },
    { value: "full", label: WORKFLOWS_ACCESS_COPY.fullAccess },
    { value: "custom", label: WORKFLOWS_ACCESS_COPY.custom }
];

const EDITOR_ID = "workflows-access-editor";
const EDITOR_DESCRIPTION_ID = "workflows-access-editor-description";
const REASSIGN_ID = "workflows-access-reassign";
const REASSIGN_DESCRIPTION_ID = "workflows-access-reassign-description";

const toAccessLevel = (selected: string): WorkflowsAccessLevel | null => {
    if (selected === "none" || selected === "full" || selected === "custom") {
        return selected;
    }
    return null;
};

/*
 * The Workflows group of the role form and the API key form (R333, Q60, design DS:103-135). A thin
 * controlled component: the permission list from `usePermissionValue` is the state and the pure
 * functions of `domain/permissions` read and write it. `onChange` runs only on a user action that
 * changes the group, never on mount, so opening a role does not dirty the form and a legacy
 * `{ name: "workflows.*", editor: true }` is rewritten only when the admin changes the group. A `*`
 * entry shows as Full with every control disabled. No AACL check: workflows has its own licence.
 */
export const WorkflowsRolePermissions = () => {
    const { value, onChange } = usePermissionValue();
    const access = readWorkflowsAccess(value);
    const note = getWorkflowsAccessNote(access);

    const changeLevel = (selected: string): void => {
        const level = toAccessLevel(selected);
        if (level === null || access.locked || level === access.level) {
            return;
        }
        const next = changeWorkflowsAccessLevel(access, level);
        const permissions = writeWorkflowsAccess(value, next);
        onChange(permissions);
    };

    const changeEditor = (checked: boolean): void => {
        if (access.locked) {
            return;
        }
        const next: WorkflowsAccess = { ...access, editor: checked };
        const permissions = writeWorkflowsAccess(value, next);
        onChange(permissions);
    };

    const changeReassign = (checked: boolean): void => {
        if (access.locked) {
            return;
        }
        const next: WorkflowsAccess = { ...access, reassign: checked };
        const permissions = writeWorkflowsAccess(value, next);
        onChange(permissions);
    };

    return (
        <div className={"flex flex-col gap-md pt-md"}>
            <SegmentedControl
                label={WORKFLOWS_ACCESS_COPY.levelLabel}
                items={LEVEL_ITEMS}
                value={access.level}
                disabled={access.locked}
                onChange={changeLevel}
            />
            {access.level === "custom" && (
                <div className={"flex flex-col gap-sm-extra"}>
                    <div className={"flex flex-col gap-xxs"}>
                        <Checkbox
                            id={EDITOR_ID}
                            label={WORKFLOWS_ACCESS_COPY.editorLabel}
                            checked={access.editor}
                            disabled={access.locked}
                            onChange={changeEditor}
                            aria-describedby={EDITOR_DESCRIPTION_ID}
                        />
                        <Text
                            as={"div"}
                            id={EDITOR_DESCRIPTION_ID}
                            size={"sm"}
                            className={"pl-lg text-neutral-strong"}
                        >
                            {WORKFLOWS_ACCESS_COPY.editorDescription}
                        </Text>
                    </div>
                    <div className={"flex flex-col gap-xxs"}>
                        <Checkbox
                            id={REASSIGN_ID}
                            label={WORKFLOWS_ACCESS_COPY.reassignLabel}
                            checked={access.reassign}
                            disabled={access.locked}
                            onChange={changeReassign}
                            aria-describedby={REASSIGN_DESCRIPTION_ID}
                        />
                        <Text
                            as={"div"}
                            id={REASSIGN_DESCRIPTION_ID}
                            size={"sm"}
                            className={"pl-lg text-neutral-strong"}
                        >
                            {WORKFLOWS_ACCESS_COPY.reassignDescription}
                        </Text>
                    </div>
                </div>
            )}
            {note !== null && (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    {note}
                </Text>
            )}
            <div
                className={
                    "flex items-start gap-sm rounded-md bg-neutral-subtle px-sm-extra py-sm-plus"
                }
            >
                <Icon icon={<InfoIcon />} label={""} size={"sm"} color={"neutral-light"} />
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    {WORKFLOWS_ACCESS_COPY.reviewingNote}
                </Text>
            </div>
        </div>
    );
};
```

Replace `packages/app-workflows/src/presentation/permissions/SecurityPermissions.tsx` (whole file; before):

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/flowchart.svg";
import { WORKFLOWS_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="workflows"
                title="Workflows"
                description="Manage Workflows permissions."
                icon={<PermissionsIcon />}
                schema={WORKFLOWS_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
```

after:

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as WorkflowsIcon } from "@webiny/icons/account_tree.svg";
import { WORKFLOWS_ACCESS_COPY } from "~/domain/permissions/workflowsAccessCopy.js";
import { WorkflowsRolePermissions } from "./WorkflowsRolePermissions.js";

const { Security } = AdminConfig;

// The Workflows group of the role and API key forms: a custom element, not the schema renderer (R333).
export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="workflows"
                title={WORKFLOWS_ACCESS_COPY.title}
                description={WORKFLOWS_ACCESS_COPY.description}
                icon={<WorkflowsIcon />}
                element={<WorkflowsRolePermissions />}
            />
        </AdminConfig>
    );
};
```

`presentation/permissions/index.tsx`, `app.tsx` and `index.tsx` do not change (`<SecurityPermissions />` is already mounted inside the flag gate of `WorkflowsAdminApp`).

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.a109.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/SecurityPermissions.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: PASS. Notes for the first run:

- `WorkflowsRolePermissions.a109.test.tsx`: if `vi.waitFor` times out waiting for `select option[value="full"]`, the Radix select did not render its hidden native select (it does so when its trigger sits inside a `form`, `@radix-ui/react-select` 2.x `isFormControl`, and it fills the native options once the admin-ui select presenter has its options, one effect after mount). Then drive the select with the keyboard instead: `fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" })` opens it, `fireEvent.keyDown(screen.getByRole("option", { name: "Full access" }), { key: "Enter" })` picks the option (Radix `SELECTION_KEYS`); keep every assertion. Record which path was used.
- verify: the `vi.mock` of `@webiny/app-admin/presentation/security/hooks/useAuthentication.js` replaces the hook inside `PermissionRenderer` (it imports it through `~/exports/admin/security.js`; both resolve to `packages/app-admin/src/presentation/security/hooks/useAuthentication.ts` through the package's tsconfig paths, and vitest mocks by resolved file). If the render throws a DI resolution error for `LogInFeature`, the mock did not apply: also mock `@webiny/app-admin/exports/admin/security.js` with `importOriginal` spread plus the same `useAuthentication`, and record it.
- A109 itself is a fact about `app-admin` (`serializePermissions` keeps every entry whose name does not start with the schema prefix, `usePermissionForm.ts`): if a foreign group's change drops or reorders the `workflows` entries, **stop and report** (R341); do not change `app-admin` or the assertions.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/domain/permissions/writeWorkflowsAccess.test.ts 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors (the build type-checks the co-located tests, R243). `app.cleanup.test.tsx` still passes: `domain/permissionsSchema.ts` and `features/permissions` still exist (Task 17 deletes them) and nothing in `app.tsx` or `index.tsx` changed.

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
git commit -m "feat(app-workflows): grant workflows access in the role form" -m "The Workflows permission group is a custom element: No access, Full access and Custom with the Manage workflows and Reassign and operate checkboxes, the level notes and the reviewing note. It owns only the workflows entries, writes only on a user action, shows a * entry as locked Full and needs no AACL licence, so reassign can now be granted." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The level control sits at the top of the group body, not in the card header.** The design puts the segmented control on the header row next to the title (DS:113-115); the header belongs to the base `Permissions` accordion (`Accordion.Item` with title, description and icon, `Permissions.tsx`), which a registered element cannot reach without an `app-admin` change (out of scope, Global Constraints). Title, description and `account_tree` icon are passed to the registration and shown by that header.
- **The note and description text use admin-ui `Text size="sm"` (12px).** R333 says 13px; the admin-ui theme has no 13px text size (`--text-sm: 12px`, `--text-md: 14px`, `admin-ui/src/theme.css:264-271`), and the 9b forms use `sm` for the same kind of hint.
- **The checkbox descriptions are separate `Text` blocks linked with `aria-describedby`,** not the admin-ui `Checkbox` `description` prop, which renders above the box (`Checkbox.tsx`, `FormComponentDescription` before the primitive) while the design puts it under the label (DS:121-122). The box's accessible name stays its label (`Manage workflows`, `Reassign and operate`).
- **`Access level` is rendered as the `SegmentedControl` `label` (visible).** Copy gap 1 fallback; the admin-ui control renders `label` as a visible form label and does not wire it to the `radiogroup` (no `aria-labelledby`), so the test asserts the visible text only.
- **The `info` icon is decorative (`label=""`)**, as `ReviewBar.tsx:61` does for its notice icon; any spoken label would be a string with no source.
- **The icon is not asserted by test:** every `@webiny/icons/*.svg` maps to one stub in tests (`vitest.config.ts` alias), so `SecurityPermissions.test.tsx` asserts that an icon is registered and review checks that it is `account_tree.svg`.
- **`app.test.tsx` mock change:** the `SecurityPermissions` mock now renders a `data-testid="workflows-security-permissions"` div instead of `null` so the flag-off A109 case can be asserted (R341). Task 17's cleanup keeps this mock (it spreads the real module, which still exports `SecurityPermissions`).
- **The A109 render test drives the base `Select` through Radix's hidden native select** (the harness wraps the groups in a `form`); Step 4 gives the keyboard fallback. It mocks `useAuthentication` at its module path because `PermissionRenderer` needs it and the test builds no login features.
- Size: medium (one component, one rewritten registration file, three new test files, two hunks in `app.test.tsx`).

## Review fixes (sub-phase review)

- `SecurityPermissions.test.tsx` rendered with plain `render`, without `AdminUiProvider`. The element's `SegmentedControl` label goes through admin-ui `FormComponentLabel` -> `Label`, which calls `useAdminUi()` and throws "AdminUiProvider is missing from the component tree." (`admin-ui/src/Label/Label.tsx:56`, `AdminUiProvider` `useAdminUi`). The test now renders with `renderWithAdminUi` (R243 helper) and no longer imports `render`.
