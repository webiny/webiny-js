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
