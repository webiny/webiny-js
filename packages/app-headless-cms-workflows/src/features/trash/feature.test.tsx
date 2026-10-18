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
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import { DeleteEntryRevisionUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import { PermanentlyDeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflows } from "~/index.js";
import { CmsReviewTrashFeature } from "./feature.js";

// The composition root also mounts the other CMS workflow features; they are stubbed as in `src/index.test.tsx`.
vi.mock("~/Components/CmsEntriesList/CmsReviewMoveEntryAction.js", () => {
    return { CmsReviewMoveEntryAction: () => null };
});

vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowEditor: () => null };
});

vi.mock("~/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryReviewBar: () => null,
        CmsEntryReviewBlockedActions: () => null,
        CmsEntryReviewFormLock: () => null,
        CmsEntryReviewNewRevision: () => null,
        CmsEntryReviewScheduleMenuItem: () => null
    };
});

vi.mock("~/Components/ContentReviews/CmsContentReviews.js", () => {
    return { CmsContentReviews: () => <div data-testid="cms-content-reviews" /> };
});

vi.mock("~/Components/ContentReviews/CmsContentReviewsSidebarItem.js", () => {
    return {
        CmsContentReviewsSidebarItem: () => <div data-testid="cms-content-reviews-sidebar" />
    };
});

vi.mock("~/presentation/feature.js", () => {
    return {
        CmsWorkflowsFeature: { name: "Mock", register: () => undefined, resolve: () => undefined }
    };
});

vi.mock("~/features/feature.js", () => {
    return {
        CmsWorkflowsCacheFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

vi.mock("~/presentation/cmsWorkflowsEditor/feature.js", () => {
    return {
        CmsWorkflowsEditorPresenterFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

describe("CmsWorkflows (composition root)", () => {
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
            runBulk: vi.fn()
        };
        const decoratee = { execute: vi.fn(async () => true) };
        const container = new Container();
        container.registerInstance(FeatureFlagsService, flagsService);
        container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
        container.registerInstance(
            ActiveReviewGuard,
            guard as unknown as ActiveReviewGuard.Interface
        );
        container.registerInstance(DeleteEntryUseCase, decoratee);
        return { container, guard, decoratee };
    };

    it("wraps the delete use case with the review guard when the flag is on", async () => {
        const { container, guard, decoratee } = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        await container.resolve(DeleteEntryUseCase).execute({ model: MODEL, id: "entry-1" });

        expect(guard.run).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });

    it("leaves the delete use case unwrapped when the flag is off", async () => {
        const { container, guard, decoratee } = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        await container.resolve(DeleteEntryUseCase).execute({ model: MODEL, id: "entry-1" });

        expect(guard.run).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });
});

describe("CmsReviewTrashFeature", () => {
    function setup() {
        const guard = {
            run: vi.fn(async <TResult,>(params: ActiveReviewGuard.Params<TResult>) =>
                params.action()
            ),
            runBulk: vi.fn(async <TItem,>(params: ActiveReviewGuard.BulkParams<TItem>) =>
                params.run(params.items, false)
            ),
            confirmBlocking: vi.fn()
        };
        const useCases = { cancelForDelete: vi.fn(), listBlockingReviews: vi.fn(async () => []) };
        const container = new Container();
        container.registerInstance(Notifications, {
            error: vi.fn()
        } as unknown as Notifications.Interface);
        container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
        container.registerInstance(
            ActiveReviewGuard,
            guard as unknown as ActiveReviewGuard.Interface
        );
        container.registerInstance(
            CmsReviewUseCases,
            useCases as unknown as CmsReviewUseCases.Interface
        );
        container.registerInstance(DeleteEntryUseCase, { execute: vi.fn(async () => true) });
        container.registerInstance(DeleteEntryRevisionUseCase, {
            execute: vi.fn(async () => true)
        });
        container.registerInstance(PermanentlyDeleteEntryUseCase, {
            execute: vi.fn(async () => true)
        });
        const bulkDecoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        container.registerInstance(BulkDeletePresenter, bulkDecoratee);
        CmsReviewTrashFeature.register(container);
        return { container, guard, useCases, bulkDecoratee };
    }

    it("decorates the three delete use cases and the bulk presenter", async () => {
        const { container, guard, useCases } = setup();

        await container.resolve(DeleteEntryUseCase).execute({ model: MODEL, id: "entry-1" });
        await container
            .resolve(DeleteEntryRevisionUseCase)
            .execute({ model: MODEL, revisionId: "entry-1#0002" });
        await container
            .resolve(PermanentlyDeleteEntryUseCase)
            .execute({ model: MODEL, id: "entry-1" });
        await container
            .resolve(BulkDeletePresenter)
            .execute([{ id: "e1#0001", entryId: "e1" } as CmsContentEntry], false);

        expect(guard.run).toHaveBeenCalledTimes(3);
        expect(guard.run.mock.calls.map(call => call[0].revisionId)).toEqual([
            null,
            "entry-1#0002",
            null
        ]);
        expect(guard.run.mock.calls.every(call => call[0].useCases === useCases)).toBe(true);
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
    });

    it("checks the loaded rows for reviews in progress before the bulk task, through the decorated presenter", async () => {
        const { container, guard, useCases, bulkDecoratee } = setup();
        const rows = [{ id: "e1#0001", entryId: "e1" } as CmsContentEntry];

        await container.resolve(BulkDeletePresenter).execute(rows, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetIds: ["e1"]
        });
        expect(guard.runBulk).not.toHaveBeenCalled();
        expect(bulkDecoratee.execute).toHaveBeenCalledWith(rows, true);
    });
});
