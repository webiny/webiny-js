import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { screen } from "@testing-library/react";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import type { PickerOption } from "./PickerOption.js";
import type { PickerOptionIcon } from "./PickerOptionIcon.js";
import { renderPickerOption } from "./renderPickerOption.js";

const renderOption = (option: PickerOption) => {
    return renderWithAdminUi(<>{renderPickerOption(option)}</>);
};

const ICON_NAMES: PickerOptionIcon[] = [
    "person",
    "person_off",
    "group",
    "group_off",
    "groups",
    "folder",
    "folder_open",
    "lock"
];

describe("renderPickerOption (R307)", () => {
    it("shows the label, the sub line and the warning", () => {
        renderOption(
            createPickerOption({
                label: "Press",
                description: "0 members",
                warning: "This team has no members"
            })
        );

        expect(screen.getByText("Press")).toBeTruthy();
        expect(screen.getByText("0 members")).toBeTruthy();
        expect(screen.getByText("This team has no members")).toBeTruthy();
    });

    it("shows no sub line and no icon for a plain option", () => {
        renderOption(createPickerOption({ label: "Legal" }));

        expect(screen.getByText("Legal")).toBeTruthy();
        expect(document.querySelector("[data-picker-icon]")).toBeNull();
    });

    for (const name of ICON_NAMES) {
        it(`shows the ${name} icon in the icon column`, () => {
            renderOption(createPickerOption({ label: "Row", icon: name }));

            const icons = document.querySelectorAll("[data-picker-icon]");
            expect(icons).toHaveLength(1);
            expect(icons[0].getAttribute("data-picker-icon")).toBe(name);
        });
    }

    it("keeps the label next to the icon", () => {
        renderOption(createPickerOption({ label: "Restricted folder", icon: "lock" }));

        expect(screen.getByText("Restricted folder")).toBeTruthy();
        expect(document.querySelector('[data-picker-icon="lock"]')).not.toBeNull();
    });

    it("shows a muted label in the muted text colour and a normal one not", () => {
        renderOption(
            createPickerOption({ label: "Deleted user", muted: true, icon: "person_off" })
        );
        const muted = screen.getByText("Deleted user");

        expect(muted.className).toContain("text-neutral-strong");
    });

    it("does not mute a normal label", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", icon: "person" }));
        const normal = screen.getByText("Ivan Horvat");

        expect(normal.className).not.toContain("text-neutral-strong");
    });
});
