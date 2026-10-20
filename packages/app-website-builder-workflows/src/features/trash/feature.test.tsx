import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { DeletePageRevisionUseCase } from "@webiny/app-website-builder/features/pages/deletePageRevision/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { createTrashUseCaseFakes } from "@webiny/app-workflows/review/testing/createTrashUseCaseFakes.js";
import { registerTrashUseCaseFakes } from "@webiny/app-workflows/review/testing/registerTrashUseCaseFakes.js";
import { WebsiteBuilderWorkflows } from "~/index.js";
import { WbReviewTrashFeature } from "./feature.js";

// The composition root also mounts the other WB workflow features; they are stubbed as in `src/index.test.tsx`.
vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/index.js", () => {
    return {
        PageEditorConfig: () => null,
        PagesList: () => null
    };
});

vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
    return { WbContentReviews: () => null };
});

vi.mock("~/presentation/page/PageList/feature.js", () => {
    return {
        PageListWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

vi.mock("~/presentation/page/PageGet/feature.js", () => {
    return {
        PageGetWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

describe("WebsiteBuilderWorkflows (composition root)", () => {
    const createContainer = (isEnabled: boolean) => {
        const flagsService: FeatureFlagsService.Interface = {
            getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
            isLoaded: () => true,
            loadFlags: async () => undefined
        };
        const guard = {
            run: vi.fn(async <TResult,>(params: ActiveReviewGuard.Params<TResult>) =>
                params.action()
            ),
            runBulk: vi.fn(async <TItem,>(params: ActiveReviewGuard.BulkParams<TItem>) =>
                params.run(params.items, false)
            )
        };
        const deletePage = { execute: vi.fn(async () => true) };
        const deleteRevision = { execute: vi.fn(async () => true) };
        const bulk = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async () => undefined)
        };
        const container = new Container();
        container.registerInstance(FeatureFlagsService, flagsService);
        container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
        container.registerInstance(ReviewNotificationService, { handle: vi.fn() });
        container.registerInstance(
            ActiveReviewGuard,
            guard as unknown as ActiveReviewGuard.Interface
        );
        container.registerInstance(DeletePageUseCase, deletePage);
        container.registerInstance(DeletePageRevisionUseCase, deleteRevision);
        container.registerInstance(BulkDeletePresenter, bulk);
        return { container, guard, deletePage, deleteRevision, bulk };
    };

    const exercise = async (container: Container) => {
        await container.resolve(DeletePageUseCase).execute({ id: "p1#0001", permanently: false });
        await container.resolve(DeletePageRevisionUseCase).execute({ id: "p1#0002" });
        await container
            .resolve(BulkDeletePresenter)
            .execute([Page.create({ id: "p1#0001", entryId: "p1" })]);
    };

    it("wraps the page delete, revision delete and bulk delete with the guard when the flag is on", async () => {
        const { container, guard, deletePage, deleteRevision } = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        await exercise(container);

        expect(guard.run).toHaveBeenCalledTimes(2);
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        expect(deletePage.execute).toHaveBeenCalledTimes(1);
        expect(deleteRevision.execute).toHaveBeenCalledTimes(1);
    });

    it("leaves all three unwrapped when the flag is off", async () => {
        const { container, guard, deletePage, deleteRevision, bulk } = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        await exercise(container);

        expect(guard.run).not.toHaveBeenCalled();
        expect(guard.runBulk).not.toHaveBeenCalled();
        expect(deletePage.execute).toHaveBeenCalledTimes(1);
        expect(deleteRevision.execute).toHaveBeenCalledTimes(1);
        expect(bulk.execute).toHaveBeenCalledTimes(1);
    });
});

describe("WbReviewTrashFeature", () => {
    function setup() {
        const guard = {
            run: vi.fn(async <TResult,>(params: ActiveReviewGuard.Params<TResult>) =>
                params.action()
            ),
            runBulk: vi.fn(async <TItem,>(params: ActiveReviewGuard.BulkParams<TItem>) =>
                params.run(params.items, false)
            )
        };
        const useCases = createTrashUseCaseFakes();
        const container = new Container();
        container.registerInstance(
            ActiveReviewGuard,
            guard as unknown as ActiveReviewGuard.Interface
        );
        registerTrashUseCaseFakes(container, useCases);
        container.registerInstance(DeletePageUseCase, { execute: vi.fn(async () => true) });
        container.registerInstance(DeletePageRevisionUseCase, { execute: vi.fn(async () => true) });
        container.registerInstance(BulkDeletePresenter, {
            vm: { processing: false, results: [] },
            execute: vi.fn(async () => undefined)
        });
        WbReviewTrashFeature.register(container);
        return { container, guard, useCases };
    }

    it("decorates the two delete use cases and the bulk presenter", async () => {
        const { container, guard } = setup();

        await container
            .resolve(DeletePageUseCase)
            .execute({ id: "page-1#0001", permanently: false });
        await container.resolve(DeletePageRevisionUseCase).execute({ id: "page-1#0002" });
        await container
            .resolve(BulkDeletePresenter)
            .execute([Page.create({ id: "p1#0001", entryId: "p1" })]);

        expect(guard.run).toHaveBeenCalledTimes(2);
        expect(guard.run.mock.calls.map(call => call[0].revisionId)).toEqual([null, "page-1#0002"]);
        expect(guard.run.mock.calls.every(call => !("useCases" in call[0]))).toBe(true);
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
    });
});
