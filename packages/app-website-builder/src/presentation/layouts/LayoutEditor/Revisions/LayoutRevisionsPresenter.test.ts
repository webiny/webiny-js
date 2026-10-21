import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { WbPageStatus, type WbStatus } from "~/constants.js";
import { type Layout, LayoutError, LayoutsGateway } from "~/features/layouts/index.js";
import { LayoutsRepository } from "~/features/layouts/shared/LayoutsRepository.js";
import { GetLayoutRevisionsFeature } from "~/features/layouts/getLayoutRevisions/feature.js";
import { PublishLayoutFeature } from "~/features/layouts/publishLayout/feature.js";
import { UnpublishLayoutFeature } from "~/features/layouts/unpublishLayout/feature.js";
import { CreateLayoutRevisionFromFeature } from "~/features/layouts/createLayoutRevisionFrom/feature.js";
import { DeleteLayoutRevisionFeature } from "~/features/layouts/deleteLayoutRevision/feature.js";
import { LayoutRevisionsPresenter } from "./abstractions.js";
import { LayoutRevisionsPresenterRegistration } from "./LayoutRevisionsPresenter.js";

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const revision = (version: number, status: WbStatus): Layout => ({
    id: `site#000${version}`,
    entryId: "site",
    status,
    version,
    locked: status !== WbPageStatus.Draft,
    live: null,
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

describe("LayoutRevisionsPresenter", () => {
    const gateway = {
        getRevisions: vi.fn(),
        unpublish: vi.fn(),
        publish: vi.fn()
    };
    const notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };
    const permissions = {
        canEdit: () => true,
        canDelete: () => true,
        canPublish: () => true,
        canUnpublish: () => true
    };
    let presenter: LayoutRevisionsPresenter.Interface;

    beforeEach(async () => {
        vi.clearAllMocks();
        gateway.getRevisions.mockResolvedValue([
            revision(1, WbPageStatus.Published),
            revision(2, WbPageStatus.Draft)
        ]);

        const container = new Container();
        container.registerInstance(LayoutsGateway, gateway as any);
        container.register(LayoutsRepository).inSingletonScope();
        GetLayoutRevisionsFeature.register(container);
        PublishLayoutFeature.register(container);
        UnpublishLayoutFeature.register(container);
        CreateLayoutRevisionFromFeature.register(container);
        DeleteLayoutRevisionFeature.register(container);
        container.registerInstance(WbPermissions, permissions as any);
        container.registerInstance(Notifications, notifications as any);
        container.register(LayoutRevisionsPresenterRegistration).inSingletonScope();
        presenter = container.resolve(LayoutRevisionsPresenter);

        presenter.init("site");
        await flush();
    });

    it("lists the revisions, newest first, with what may be done to them", () => {
        const [draft, published] = presenter.vm.revisions;

        expect(draft.label).toBe("v2 (Draft)");
        expect(draft.canEdit).toBe(true);
        expect(draft.canPublish).toBe(true);
        expect(draft.canUnpublish).toBe(false);

        expect(published.label).toBe("v1 (Published)");
        expect(published.canEdit).toBe(false);
        expect(published.canPublish).toBe(false);
        expect(published.canUnpublish).toBe(true);
    });

    it("explains why a layout in use can't be unpublished", async () => {
        gateway.unpublish.mockRejectedValue(
            new LayoutError({
                message: "Layout is in use.",
                code: "WebsiteBuilder/Layout/InUse",
                data: { id: "site", pages: 1, isDefault: false }
            })
        );

        const result = await presenter.unpublish({ id: "site#0001", version: 1 });

        expect(result).toBeNull();
        expect(notifications.warning).toHaveBeenCalledWith({
            title: "Could not unpublish the revision",
            description:
                "This layout is in use by 1 page. Pick another layout in their settings first."
        });
        expect(presenter.vm.revisions[1].revision.status).toBe(WbPageStatus.Published);
    });

    it("publishes a revision", async () => {
        gateway.publish.mockResolvedValue({
            ...revision(2, WbPageStatus.Published),
            live: { version: 2 }
        });

        await presenter.publish({ id: "site#0002", version: 2 });

        expect(presenter.vm.revisions.map(item => item.revision.status)).toEqual([
            WbPageStatus.Published,
            WbPageStatus.Unpublished
        ]);
        expect(notifications.success).toHaveBeenCalledWith({
            title: "Revision #2 was published."
        });
    });
});
