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
    { id: "u1", displayName: "Ivan Horvat", teamNames: [], excluded: false, excludedReason: null },
    { id: "u2", displayName: "Petra Novak", teamNames: [], excluded: true, excludedReason: null }
];

const createPresenter = () => {
    const container = new Container();
    ReviewerPickerPresenterFeature.register(container);
    return ReviewerPickerPresenterFeature.resolve(container).presenter;
};

describe("ReviewerPicker", () => {
    it("renders the label and the hint", async () => {
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

        expect(screen.getAllByText("Reviewer").length).toBeGreaterThan(0);
        expect(screen.getByText("Picks are checked again.")).toBeTruthy();
    });

    it("shows the load error with Retry that reloads", async () => {
        const presenter = createPresenter();
        const load = vi
            .fn()
            .mockRejectedValueOnce(new Error("Network."))
            .mockResolvedValue(CANDIDATES);
        await presenter.init({ load, currentOwnerId: null, selectedId: null });

        renderWithAdminUi(<ReviewerPicker presenter={presenter} label={"Reviewer"} />);

        expect(screen.getByText("Could not load results.")).toBeTruthy();
        fireEvent.click(screen.getByText("Retry"));
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    });

    it("offers the options with the disabled one marked Unavailable", async () => {
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
        expect(screen.getByText("Petra Novak (Unavailable)")).toBeTruthy();
    });
});
