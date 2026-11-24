import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { RulesEmptyNote } from "./RulesEmptyNote.js";

describe("RulesEmptyNote (design 4.2)", () => {
    afterEach(() => {
        cleanup();
    });

    it("says reviews wait in the team pool for the strategy none", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={"none"} disabled={false} onAdd={vi.fn()} />);

        expect(
            screen.getByText("No routing rules. Every review waits in the team pool.")
        ).toBeDefined();
    });

    it("names the strategy for any other strategy", () => {
        renderWithAdminUi(
            <RulesEmptyNote strategy={"roundRobin"} disabled={false} onAdd={vi.fn()} />
        );

        expect(
            screen.getByText("No routing rules. Round-robin assigns every review on this step.")
        ).toBeDefined();

        cleanup();
        renderWithAdminUi(
            <RulesEmptyNote strategy={"leastLoaded"} disabled={false} onAdd={vi.fn()} />
        );

        expect(
            screen.getByText("No routing rules. Least-loaded assigns every review on this step.")
        ).toBeDefined();
    });

    it("treats an unknown strategy generically", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={null} disabled={false} onAdd={vi.fn()} />);

        expect(
            screen.getByText("No routing rules. The strategy assigns every review on this step.")
        ).toBeDefined();
    });

    it("adds a rule from the empty state", () => {
        const onAdd = vi.fn();
        renderWithAdminUi(<RulesEmptyNote strategy={"none"} disabled={false} onAdd={onAdd} />);

        fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

        expect(onAdd).toHaveBeenCalledTimes(1);
    });
});
