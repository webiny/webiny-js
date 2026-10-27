import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { ReviewerPickerPresenterFeature } from "../feature.js";
import { ReviewerPicker } from "./ReviewerPicker.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import type { StepCandidate } from "~/review/domain/types.js";

const CANDIDATES: StepCandidate[] = [
    {
        id: "u1",
        displayName: "Ivan Horvat",
        teamNames: ["Marketing"],
        excluded: false,
        excludedReason: null
    },
    { id: "u2", displayName: "Petra Novak", teamNames: [], excluded: true, excludedReason: null }
];

const createPresenter = () => {
    const container = new Container();
    ReviewerPickerPresenterFeature.register(container);
    return ReviewerPickerPresenterFeature.resolve(container).presenter;
};

describe("ReviewerPicker", () => {
    it("renders the hint and uses the label as the accessible name", async () => {
        const presenter = createPresenter();
        await presenter.init({
            load: vi.fn().mockResolvedValue(CANDIDATES),
            currentOwnerId: null,
            selectedId: null
        });

        renderWithAdminUi(
            <ReviewerPicker
                presenter={presenter}
                label={"Reviewer"}
                hint={"Picks are checked again."}
            />
        );

        expect(screen.queryByText("Reviewer")).toBeNull();
        expect(screen.getByRole("group", { name: "Reviewer" })).toBeTruthy();
        expect(screen.getByText("Picks are checked again.")).toBeTruthy();
    });

    it("keeps the field on a load error and shows the error with Try again in the open list", async () => {
        const presenter = createPresenter();
        const load = vi
            .fn()
            .mockRejectedValueOnce(new Error("Network."))
            .mockResolvedValue(CANDIDATES);
        await presenter.init({ load, currentOwnerId: null, selectedId: null });

        renderWithAdminUi(<ReviewerPicker presenter={presenter} label={"Reviewer"} />);

        const input = screen.getByRole("combobox");
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });

        expect(await screen.findByText("Could not load results.")).toBeTruthy();
        fireEvent.click(screen.getByText("Try again"));
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    });

    it("offers each person with initials and teams, the disabled one with its note", async () => {
        const presenter = createPresenter();
        await presenter.init({
            load: vi.fn().mockResolvedValue(CANDIDATES),
            currentOwnerId: null,
            selectedId: null
        });

        renderWithAdminUi(<ReviewerPicker presenter={presenter} label={"Reviewer"} />);
        const input = screen.getByRole("combobox");
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });

        expect(await screen.findByText("Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("IH")).toBeTruthy();
        expect(screen.getByText("Marketing")).toBeTruthy();
        expect(screen.getByText("Petra Novak")).toBeTruthy();
        expect(screen.getByText("Unavailable")).toBeTruthy();
    });
});
