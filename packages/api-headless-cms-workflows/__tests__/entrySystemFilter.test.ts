import { describe, expect, it } from "vitest";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createContextHandler } from "~tests/__handler/context.js";

describe("filtering CMS entries by system.workflow", () => {
    it("lists only the entries in the matching review state", async () => {
        const { context } = createContextHandler();
        const admin = await context();
        expectOk(await storeWorkflow(admin));
        const inReview = await createAuthorEntry(admin, { name: "Ann" });
        await createAuthorEntry(admin, { name: "Bob" });
        await requestEntryReview(admin, inReview);

        const model = await getAuthorModel(admin);
        const list = admin.container.resolve(ListLatestEntriesUseCase);

        const byReviewState = expectOk(
            await list.execute(model, {
                where: { system: { workflow: { reviewState: "inProgress" } } }
            })
        );
        expect(byReviewState.entries.map(entry => entry.id)).toEqual([inReview.id]);

        const byWorkflow = expectOk(
            await list.execute(model, {
                where: { system: { workflow: { workflowId_in: ["workflow-1"] } } }
            })
        );
        expect(byWorkflow.entries.map(entry => entry.id)).toEqual([inReview.id]);
    });
});
