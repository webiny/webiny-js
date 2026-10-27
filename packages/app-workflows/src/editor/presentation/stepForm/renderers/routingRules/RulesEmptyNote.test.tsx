import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { cleanup } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { RulesEmptyNote } from "./RulesEmptyNote.js";

describe("RulesEmptyNote (design 4.2)", () => {
    afterEach(() => {
        cleanup();
    });

    it("says reviews wait in the team pool for the strategy none", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={"none"} />);

        expect(screen.getByText("No rules. Reviews wait in the team pool.")).toBeDefined();
    });

    it("says the strategy picks the reviewer for any other strategy", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={"roundRobin"} />);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();

        cleanup();
        renderWithAdminUi(<RulesEmptyNote strategy={"leastLoaded"} />);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();
    });

    it("treats an unknown strategy like a picking one", () => {
        renderWithAdminUi(<RulesEmptyNote strategy={null} />);

        expect(screen.getByText("No rules. The strategy picks the reviewer.")).toBeDefined();
    });
});
