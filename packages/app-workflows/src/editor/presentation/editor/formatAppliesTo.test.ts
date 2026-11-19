import { describe, expect, it } from "vitest";
import { formatAppliesTo } from "./formatAppliesTo.js";

describe("formatAppliesTo", () => {
    it("adds who created the workflow and the date as dd.mm.yyyy", () => {
        const text = formatAppliesTo({
            modelName: "Article",
            appLabel: "Headless CMS",
            createdBy: { id: "user-1", displayName: "Ada Lovelace" },
            createdOn: "2026-10-17T08:00:00.000Z"
        });

        expect(text).toBe(
            "Applies to Article (Headless CMS) · Created by Ada Lovelace on 17.10.2026"
        );
    });

    it("shows only the model and the app for a workflow never saved", () => {
        const text = formatAppliesTo({
            modelName: "Article",
            appLabel: "Headless CMS",
            createdBy: null,
            createdOn: null
        });

        expect(text).toBe("Applies to Article (Headless CMS)");
    });
});
