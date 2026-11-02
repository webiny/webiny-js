import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { until } from "@webiny/api/testing/until.js";
import type { Container } from "@webiny/di";
import { BaseError } from "@webiny/feature/api";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import { PageRevisionBeforeDeleteEventHandler } from "~/features/pages/DeletePageRevision/index.js";
import { DELETE_PAGE_REVISION } from "./graphql/pages.gql.js";
import { GET_PAGE_BY_ID } from "./graphql/pages.gql.js";
import { GET_PAGE_REVISIONS } from "./graphql/pages.gql.js";

class RefusedError extends BaseError<{ reason: string }> {
    override readonly code = "Test/Refused" as const;

    public constructor() {
        super({ message: "Refused by a handler.", data: { reason: "in review" } });
    }
}

class RefuseRevisionDelete implements PageRevisionBeforeDeleteEventHandler.Interface {
    public async handle(): Promise<void> {
        throw new RefusedError();
    }
}

const registerRefusal = (container: Container) => {
    container.register(
        PageRevisionBeforeDeleteEventHandler.createImplementation({
            implementation: RefuseRevisionDelete,
            dependencies: []
        })
    );
};

interface PageRow {
    id: string;
    entryId: string;
    version: number;
}

/** A page with two revisions, created through GraphQL. */
const createPageWithTwoRevisions = async (handler: ReturnType<typeof useGraphQlHandler>) => {
    const [created] = await handler.wb.createPage({ data: pageMocks.pageA });
    const first: PageRow = created.data.websiteBuilder.createPage.data;
    const [revised] = await handler.wb.createPageRevisionFrom({ id: first.id });
    const second: PageRow = revised.data.websiteBuilder.createPageRevisionFrom.data;
    return { first, second };
};

describe("WbMutation.deletePageRevision (R235)", () => {
    it("deletes a revision and answers true", async () => {
        const handler = useGraphQlHandler();
        const { first, second } = await createPageWithTwoRevisions(handler);

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: first.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({ data: true, error: null });
        const revisions = await until(
            () =>
                handler.invoke({
                    body: { query: GET_PAGE_REVISIONS, variables: { entryId: first.entryId } }
                }),
            ([response]: any[]) => response.data.websiteBuilder.getPageRevisions.data.length === 1,
            { tries: 10 }
        );
        expect(revisions[0].data.websiteBuilder.getPageRevisions.data[0].id).toBe(second.id);
    });

    it("deletes the page when its only revision is deleted", async () => {
        const handler = useGraphQlHandler();
        const [created] = await handler.wb.createPage({ data: pageMocks.pageA });
        const page: PageRow = created.data.websiteBuilder.createPage.data;

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: page.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({ data: true, error: null });
        await until(
            () => handler.invoke({ body: { query: GET_PAGE_BY_ID, variables: { id: page.id } } }),
            ([response]: any[]) => response.data.websiteBuilder.getPageById.data === null,
            { tries: 10 }
        );
    });

    it("answers a not found error with its code and data for an unknown revision", async () => {
        const handler = useGraphQlHandler();

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: "missing-page#0001" } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({
            data: null,
            error: {
                code: "WebsiteBuilder/Page/NotFound",
                message: "Page not found!",
                data: { id: "missing-page#0001" }
            }
        });
    });

    it("answers the handler's error with its code and data when a before handler refuses", async () => {
        const handler = useGraphQlHandler({ legacyPlugins: [registerRefusal] });
        const { first } = await createPageWithTwoRevisions(handler);

        const [body] = await handler.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: first.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision).toEqual({
            data: null,
            error: {
                code: "Test/Refused",
                message: "Refused by a handler.",
                data: { reason: "in review" }
            }
        });
    });

    it("answers not authorized for a user without delete permission", async () => {
        const admin = useGraphQlHandler();
        const { first } = await createPageWithTwoRevisions(admin);
        const reader = useGraphQlHandler({ permissions: [{ name: "wb.page", rwd: "r" }] });

        const [body] = await reader.invoke({
            body: { query: DELETE_PAGE_REVISION, variables: { id: first.id } }
        });

        expect(body.data.websiteBuilder.deletePageRevision.data).toBeNull();
        expect(body.data.websiteBuilder.deletePageRevision.error.code).toBe(
            "WebsiteBuilder/Page/NotAuthorized"
        );
    });
});
