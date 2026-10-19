import React from "react";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/react-composition";
import { DiContainerProvider } from "@webiny/app";
import { Buttons } from "@webiny/app-admin";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ContentEntryEditorWithConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { useContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { RevisionsListPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/CmsEntryReview.js";
import { createEntrySession } from "./createEntrySession.js";
import type { EntrySession } from "./createEntrySession.js";
import { createFormVm } from "./createFormVm.js";

function createFakeFormPresenter(
    vm: ContentEntryFormPresenter.ViewModel
): ContentEntryFormPresenter.Interface {
    return {
        vm,
        loadRevision: vi.fn(),
        saveRevision: vi.fn(),
        publishRevision: vi.fn(),
        unpublishRevision: vi.fn(),
        deleteEntry: vi.fn(),
        setFolderId: vi.fn(),
        newEntry: vi.fn(),
        patchEntryMeta: vi.fn(),
        reset: vi.fn()
    };
}

function createFakeRevisionsPresenter(): RevisionsListPresenter.Interface {
    return {
        vm: { loading: false, revisions: [], visible: false },
        init: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        createRevision: vi.fn(),
        publishRevision: vi.fn(),
        unpublishRevision: vi.fn(),
        updateRevisionNote: vi.fn(),
        deleteRevision: vi.fn(),
        dispose: vi.fn()
    };
}

/*
 * The config components (and the form decorators) are rendered next to the editor config, as the
 * app does it: `ContentEntryEditorWithConfig` renders its children only once the registered
 * properties are collected, so config components cannot live inside it. One width property is
 * always registered, so the gate opens even when a component under test registers nothing.
 *
 * Renders what the editor renders: the header buttons through `Buttons` (so `useButtons()` works),
 * and every registered action's element for the options menu. The names list shows what is
 * registered, whatever it renders.
 */
const ActionsProbe = () => {
    const { buttonActions, menuItemActions } = useContentEntryEditorConfig();
    const buttonNames = buttonActions.map(action => action.name).join(",");
    const menuNames = menuItemActions.map(action => action.name).join(",");

    return (
        <>
            <div data-testid="button-action-names">{buttonNames}</div>
            <div data-testid="menu-action-names">{menuNames}</div>
            <div data-testid="button-actions">
                <Buttons actions={buttonActions} />
            </div>
            <div data-testid="menu-actions">
                {menuItemActions.map(action => (
                    <span key={action.name} data-action={action.name}>
                        {action.element}
                    </span>
                ))}
            </div>
        </>
    );
};

export interface RenderEditorTreeParams {
    children?: React.ReactNode;
    formVm?: Partial<ContentEntryFormPresenter.ViewModel>;
    reviewVm?: Partial<TargetReviewPresenter.ViewModel>;
}

export interface RenderedEditorTree extends EntrySession {
    container: Container;
    formPresenter: ContentEntryFormPresenter.Interface;
    revisions: RevisionsListPresenter.Interface;
}

export function renderEditorTree(params: RenderEditorTreeParams): RenderedEditorTree {
    const container = new Container();
    const entrySession = createEntrySession(params.reviewVm);
    const formVm = createFormVm(params.formVm);
    const formPresenter = createFakeFormPresenter(formVm);
    const revisions = createFakeRevisionsPresenter();

    container.registerInstance(CmsEntryReview, entrySession.session);
    container.registerInstance(ContentEntryFormPresenter, formPresenter);
    container.registerInstance(RevisionsListPresenter, revisions);

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={formVm.model}>
                        {params.children}
                        <ContentEntryEditorConfig>
                            <ContentEntryEditorConfig.Width value={"1020px"} />
                        </ContentEntryEditorConfig>
                        <ContentEntryEditorWithConfig>
                            <ActionsProbe />
                        </ContentEntryEditorWithConfig>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return { ...entrySession, container, formPresenter, revisions };
}
