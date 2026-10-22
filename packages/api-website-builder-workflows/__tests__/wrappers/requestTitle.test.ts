import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";
import { REQUESTER, WB_WRITER } from "~tests/__helpers/identities.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";

const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const requester = await createUserContext({
        identity: REQUESTER,
        permissions: WB_WRITER,
        legacyPlugins: [countEngineCalls]
    });
    return { admin, requester };
};

const request = (context: CmsContext, page: WbPage, title?: string | null) => {
    return context.container.resolve(RequestWebsiteBuilderPageReviewUseCase).execute({
        targetId: page.entryId,
        targetRevisionId: page.id,
        title
    });
};

describe("WB request review title (D135, R89)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    it("uses the requested title, trimmed", async () => {
        const { admin, requester } = await createScenario();
        const page = await createPage(admin, { title: "Page A" });

        const review = expectOk(await request(requester, page, "  Homepage launch  "));

        expect(review.title).toBe("Homepage launch");
    });

    it("refuses a title shorter than 5 characters", async () => {
        const { admin, requester } = await createScenario();
        const page = await createPage(admin, { title: "Page A" });

        const result = await request(requester, page, "Home");

        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
        // The engine validates the title after finding the bound workflow.
        expect(engineCalls).toEqual(["RequestReview", "GetBoundWorkflow", "ListWorkflows"]);
    });

    it("uses the page title when the title is missing, null or empty", async () => {
        const { admin, requester } = await createScenario();
        const missing = await createPage(admin, { title: "Page without title" });
        const nulled = await createPage(admin, { title: "Page with null title" });
        const empty = await createPage(admin, { title: "Page with empty title" });

        const fromMissing = expectOk(await request(requester, missing));
        const fromNull = expectOk(await request(requester, nulled, null));
        const fromEmpty = expectOk(await request(requester, empty, "   "));

        expect(fromMissing.title).toBe("Page without title");
        expect(fromNull.title).toBe("Page with null title");
        expect(fromEmpty.title).toBe("Page with empty title");
    });
});
