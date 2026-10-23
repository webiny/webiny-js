import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { duplicateBannerMessage } from "./duplicateBannerMessage.js";

describe("duplicateBannerMessage (QBZ-44)", () => {
    it("words the CMS banner with the model and the other workflow", () => {
        expect(
            duplicateBannerMessage({
                appKind: "cms",
                modelName: "Article",
                workflowName: "Article approval"
            })
        ).toBe(
            "Could not save the workflow — Article already has a workflow: “Article approval”. A model can have one workflow."
        );
    });

    it("words the Website Builder banner for pages", () => {
        expect(
            duplicateBannerMessage({
                appKind: "wb",
                modelName: "Pages",
                workflowName: "Pages approval"
            })
        ).toBe(
            "Could not save the workflow — Pages already have a workflow: “Pages approval”. Pages can have one workflow."
        );
    });
});
