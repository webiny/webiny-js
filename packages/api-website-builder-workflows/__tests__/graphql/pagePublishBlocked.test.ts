import { describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";

const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        websiteBuilder {
            publishPage(id: $id) {
                data {
                    id
                    status
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

describe("publishPage on /graphql with a pages workflow (A26, R103)", () => {
    it("returns the publish-blocked code and data from publishPage", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        const unreviewed = await createPage(admin, { title: "Page B" });
        await requestPageReview(admin, page);
        const user = asGraphQLUser();

        const inReview = await user.run(PUBLISH_PAGE, { id: page.id });
        const withoutReview = await user.run(PUBLISH_PAGE, { id: unreviewed.id });

        expect(inReview.data.websiteBuilder.publishPage.data).toBeNull();
        expect(inReview.data.websiteBuilder.publishPage.error).toMatchObject({
            code: "Workflows/Review/PublishBlocked",
            data: {
                model: "wb.page",
                targetRevisionId: page.id,
                workflowId: "wb-workflow",
                reviewState: "inProgress"
            }
        });
        expect(withoutReview.data.websiteBuilder.publishPage.error).toEqual({
            code: "Workflows/Review/PublishBlocked",
            message:
                "This content can only be published after its review is approved. Request a review first.",
            data: {
                model: "wb.page",
                targetRevisionId: unreviewed.id,
                workflowId: "wb-workflow",
                reviewState: null
            }
        });
    });
});
