import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { WbPageStatus, type WbStatus } from "~/constants.js";
import { type Layout, LayoutsGateway, LayoutsRepository } from "./abstractions.js";
import { LayoutsRepository as LayoutsRepositoryImpl } from "./LayoutsRepository.js";
import { LayoutsGateway as LayoutsGatewayImpl } from "./LayoutsGateway.js";
import { isLayoutInUseError, LayoutError } from "./errors.js";

const revision = (version: number, status: WbStatus, live: number | null): Layout => ({
    id: `site#000${version}`,
    entryId: "site",
    status,
    version,
    locked: status !== WbPageStatus.Draft,
    live: live ? { version: live } : null,
    properties: { title: "Site" },
    metadata: {},
    elements: {},
    bindings: {},
    extensions: {},
    createdOn: null,
    savedOn: null,
    modifiedOn: null,
    createdBy: null,
    savedBy: null
});

describe("LayoutsRepository", () => {
    const gateway = {
        list: vi.fn(),
        get: vi.fn(),
        getRevisions: vi.fn(),
        publish: vi.fn(),
        unpublish: vi.fn(),
        createRevisionFrom: vi.fn(),
        deleteRevision: vi.fn(),
        delete: vi.fn()
    };
    let repository: LayoutsRepository.Interface;

    beforeEach(async () => {
        vi.clearAllMocks();
        gateway.list.mockResolvedValue([revision(2, WbPageStatus.Draft, 1)]);
        gateway.getRevisions.mockResolvedValue([
            revision(1, WbPageStatus.Published, 1),
            revision(2, WbPageStatus.Draft, 1)
        ]);

        const container = new Container();
        container.registerInstance(LayoutsGateway, gateway as any);
        container.register(LayoutsRepositoryImpl).inSingletonScope();
        repository = container.resolve(LayoutsRepository);

        await repository.list();
        await repository.getRevisions("site");
    });

    it("keeps revisions newest first", () => {
        expect(repository.getLoadedRevisions("site").map(item => item.version)).toEqual([2, 1]);
    });

    it("unpublishes the previously published revision when another one is published", async () => {
        gateway.publish.mockResolvedValue(revision(2, WbPageStatus.Published, 2));

        await repository.publish("site#0002");

        const [v2, v1] = repository.getLoadedRevisions("site");
        expect(v2.status).toBe(WbPageStatus.Published);
        expect(v1.status).toBe(WbPageStatus.Unpublished);
        expect(v1.live).toEqual({ version: 2 });
        expect(repository.layouts[0].status).toBe(WbPageStatus.Published);
        expect(repository.layouts[0].live).toEqual({ version: 2 });
    });

    it("clears the live revision once it's unpublished", async () => {
        gateway.unpublish.mockResolvedValue(revision(1, WbPageStatus.Unpublished, null));

        await repository.unpublish("site#0001");

        expect(repository.layouts[0].live).toBeNull();
        expect(repository.getLoadedRevisions("site")[1].status).toBe(WbPageStatus.Unpublished);
    });

    it("lists a new revision as the latest one", async () => {
        gateway.createRevisionFrom.mockResolvedValue(revision(3, WbPageStatus.Draft, 1));

        await repository.createRevisionFrom("site#0001");

        expect(repository.layouts.map(item => item.id)).toEqual(["site#0003"]);
        expect(repository.getLoadedRevisions("site").map(item => item.version)).toEqual([3, 2, 1]);
    });

    it("reloads the latest revision once a revision is deleted", async () => {
        gateway.get.mockResolvedValue(revision(1, WbPageStatus.Published, 1));

        await repository.deleteRevision("site#0002");

        expect(gateway.get).toHaveBeenCalledWith("site");
        expect(repository.layouts.map(item => item.id)).toEqual(["site#0001"]);
        expect(repository.getLoadedRevisions("site").map(item => item.version)).toEqual([1]);
    });

    it("drops the layout once its last revision is deleted", async () => {
        gateway.get.mockRejectedValue(
            new LayoutError({ message: "Not found.", code: "WebsiteBuilder/Layout/NotFound" })
        );

        await repository.deleteRevision("site#0002");

        expect(repository.layouts).toEqual([]);
    });

    it("keeps the layout when reloading it fails for another reason", async () => {
        gateway.get.mockRejectedValue(new Error("Network error."));

        await repository.deleteRevision("site#0002");

        expect(repository.layouts.map(item => item.entryId)).toEqual(["site"]);
    });
});

describe("LayoutsGateway", () => {
    it("throws API errors with their code and data", async () => {
        const client = {
            execute: vi.fn().mockResolvedValue({
                websiteBuilder: {
                    unpublishLayout: {
                        data: null,
                        error: {
                            code: "WebsiteBuilder/Layout/InUse",
                            message: "Layout is in use.",
                            data: { id: "site", pages: 2, isDefault: true }
                        }
                    }
                }
            })
        };

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client as any);
        container.register(LayoutsGatewayImpl);
        const gateway = container.resolve(LayoutsGateway);

        const error = await gateway.unpublish("site#0001").catch(error => error);

        expect(isLayoutInUseError(error)).toBe(true);
        expect(error.message).toBe("Layout is in use.");
        expect(error.data).toEqual({ id: "site", pages: 2, isDefault: true });
    });

    it("maps a missing page layout to null", async () => {
        const client = {
            execute: vi.fn().mockResolvedValue({
                websiteBuilder: { getPageLayout: { data: null, error: null } }
            })
        };

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client as any);
        container.register(LayoutsGatewayImpl);
        const gateway = container.resolve(LayoutsGateway);

        expect(await gateway.getPageLayout("site", "de")).toBeNull();
        expect(client.execute.mock.calls[0][0].variables).toEqual({ id: "site", language: "de" });
    });
});
