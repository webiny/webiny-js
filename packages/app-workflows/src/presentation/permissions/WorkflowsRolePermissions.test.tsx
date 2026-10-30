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

    it("shows a workflows* entry as Full and locked: every control disabled and nothing written", () => {
        const onChange = renderGroup([{ name: "workflows*" }]);

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
