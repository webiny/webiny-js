import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/react-composition";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ContentEntryEditorWithConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { EntryProvider } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { ContentEntriesCacheProvider as ContentEntriesCacheProviderImpl } from "@webiny/app-headless-cms/features/contentEntry/ContentEntriesCacheProvider.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { GetEntryGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ListEntriesGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { TableRowMapper } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { toSystemWorkflow } from "@webiny/app-workflows/review/domain/toSystemWorkflow.js";
import { ReviewChangedEvent } from "@webiny/app-workflows/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { createReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { CmsWorkflows } from "./index.js";
import { MODEL } from "~/testing/models.js";

interface FakeActionProps {
    name: string;
    element: React.ReactElement;
}

interface FakeMenuItemProps {
    label: string;
}

vi.mock("@webiny/app-aco", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-aco")>();
    const React = await import("react");
    const Action = Object.assign(
        (props: FakeActionProps) => {
            return React.createElement("div", { "data-action": props.name }, props.element);
        },
        { OptionsMenuItem: () => null, OptionsMenuLink: () => null }
    );

    return {
        ...actual,
        AcoConfig: { ...actual.AcoConfig, Record: { ...actual.AcoConfig.Record, Action } }
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");

    return {
        ...actual,
        OptionsMenuItem: (props: FakeMenuItemProps) => {
            return React.createElement("button", { "data-testid": "blocked-move" }, props.label);
        }
    };
});

vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowEditor: () => null };
});

vi.mock("~/Components/ContentReviews/CmsContentReviews.js", () => {
    return { CmsContentReviews: () => null };
});

vi.mock("~/Components/ContentReviews/CmsContentReviewsSidebarItem.js", () => {
    return { CmsContentReviewsSidebarItem: () => null };
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

class FakeRowMapper implements TableRowMapper.Interface {
    fromEntry(entry: CmsContentEntry): TableRowMapper.EntryTableRow {
        return { id: entry.id, $selectable: true, $type: "RECORD", data: entry };
    }
}

const BaseRowMapper = TableRowMapper.createImplementation({
    implementation: FakeRowMapper,
    dependencies: []
});

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

function createEntry(reviewState: string | null): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status: "draft", version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

function mountRoot(isEnabled: boolean): Container {
    const flagsService: FeatureFlagsService.Interface = {
        getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
        isLoaded: () => true,
        loadFlags: async () => undefined
    };
    const container = new Container();
    container.registerInstance(FeatureFlagsService, flagsService);
    container.register(ContentEntriesCacheProviderImpl).inSingletonScope();
    container.register(BaseRowMapper);

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={MODEL}>
                        <CmsWorkflows />
                        {/* The editor config needs one property so the flag-off mount collects its config. */}
                        <ContentEntryEditorConfig>
                            <ContentEntryEditorConfig.Width value={"1020px"} />
                        </ContentEntryEditorConfig>
                        <ContentEntryEditorWithConfig>
                            <EntryProvider entry={createEntry("inProgress")}>
                                <EntryAction
                                    name="move"
                                    element={<span data-testid="move-item" />}
                                />
                            </EntryProvider>
                        </ContentEntryEditorWithConfig>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return container;
}

function getCachedSystem(container: Container): unknown {
    const provider = container.resolve(ContentEntriesCacheProvider);
    const entry = provider.get("article").getItem(item => item.entryId === "entry-1");
    return (entry?.meta as unknown as { system?: unknown }).system;
}

describe("CmsWorkflows list and cache wiring", () => {
    it("registers the selections, the row mapper, the Move gate and the cache sync with the flag on", async () => {
        const container = mountRoot(true);

        const listSelections = container
            .resolveAll(ListEntriesGraphQLFieldSelection)
            .flatMap(selection => selection.getSelection());
        const getSelections = container
            .resolveAll(GetEntryGraphQLFieldSelection)
            .flatMap(selection => selection.getSelection());
        expect(listSelections).toHaveLength(1);
        expect(listSelections[0]).toContain("reviewState");
        expect(getSelections).toHaveLength(1);
        expect(getSelections[0]).toContain("stepState");

        const mapper = container.resolve(TableRowMapper);
        expect(mapper.fromEntry(createEntry("inProgress")).$selectable).toBe(false);
        expect(mapper.fromEntry(createEntry(null)).$selectable).toBe(true);

        expect(await screen.findByTestId("blocked-move")).toBeTruthy();
        expect(screen.queryByTestId("move-item")).toBeNull();

        const provider = container.resolve(ContentEntriesCacheProvider);
        provider.get("article").setItems([createEntry(null)]);
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(1);
        const review = createReview({ namespace: "cms.article" });
        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: "entry-1#0001",
                review
            })
        );
        expect(getCachedSystem(container)).toEqual({ workflow: toSystemWorkflow(review) });
    });

    it("registers none of it with the flag off", async () => {
        const container = mountRoot(false);

        expect(container.resolveAll(ListEntriesGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(GetEntryGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(ReviewChangedHandler)).toHaveLength(0);

        const mapper = container.resolve(TableRowMapper);
        expect(mapper.fromEntry(createEntry("inProgress")).$selectable).toBe(true);

        expect(await screen.findByTestId("move-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-move")).toBeNull();
    });
});
