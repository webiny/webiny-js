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

    it("renders a muted label inside the muted text element", () => {
        renderOption(
            createPickerOption({ label: "Deleted user", muted: true, icon: "person_off" })
        );

        expect(screen.getByText("Deleted user").closest("[data-picker-muted]")).not.toBeNull();
    });

    it("does not mute a normal label", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", icon: "person" }));

        expect(screen.getByText("Ivan Horvat").closest("[data-picker-muted]")).toBeNull();
    });

    it("shows no note for an option without one", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", icon: "person" }));

        expect(document.querySelector("[data-picker-note]")).toBeNull();
    });

    it("shows the note on the right with the full text in its title (R332)", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", note: "In the list" }));
        const note = screen.getByText("In the list");

        expect(note.getAttribute("data-picker-note")).not.toBeNull();
        expect(note.getAttribute("title")).toBe("In the list");
    });

    it("keeps the full text of a long note in its title (QBZ-78)", () => {
        const long = "In the list since the start of the quarter, until someone removes the entry";
        renderOption(createPickerOption({ label: "Ivan Horvat", note: long }));
        const note = screen.getByText(long);

        expect(note.getAttribute("title")).toBe(long);
    });

    it("puts the note in the row's text after the label, so it is part of the accessible name", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", note: "In the list" }));
        const note = screen.getByText("In the list");
        const row = note.closest("[data-picker-row]");

        expect(row?.textContent).toBe("Ivan HorvatIn the list");
    });

    it("keeps the note next to the icon column for a row marked disabled", () => {
        renderOption(
            createPickerOption({
                label: "Ivan Horvat",
                disabled: true,
                icon: "person",
                note: "In the list"
            })
        );

        expect(screen.getByText("In the list")).toBeTruthy();
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();
        expect(document.querySelector('[data-picker-icon="person"]')).not.toBeNull();
    });
});
