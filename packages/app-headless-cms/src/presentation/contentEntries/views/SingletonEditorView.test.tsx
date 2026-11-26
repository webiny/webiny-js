/**
 * @vitest-environment jsdom
 */
import React from "react";
import { observable, runInAction } from "mobx";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsModel } from "~/types.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { CreateEntryUseCase } from "~/features/contentEntry/createEntry/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/updateEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { ContentEntryFormPresenter } from "~/presentation/contentEntries/form/ContentEntryFormPresenter.js";
import { RevisionsListPresenter } from "~/presentation/contentEntries/revisionsList/abstractions.js";
import { SingletonEditorPresenter } from "~/presentation/contentEntries/singletonEditor/abstractions.js";
import { SaveContentButton } from "./actions/SaveContentButton.js";
import { SaveAndPublishButton } from "./actions/SaveAndPublishButton.js";
import { PublishOnlyButton } from "./actions/PublishOnlyButton.js";
import { CreateNewRevisionButton } from "./actions/CreateNewRevisionButton.js";
import { IsModelPublishable } from "~/admin/components/IsModelPublishable.js";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { ContentEntryEditorBody } from "./ContentEntryEditorBody.js";
import { SingletonEditorView } from "./SingletonEditorView.js";

interface ButtonActionConfig {
    name: string;
    element: React.ReactElement;
}

interface RouteParams {
    id?: string;
    modelId: string;
}

/** The route params, which components re-render on, as they do on a real route change. */
interface RouteStore {
    params: RouteParams;
    listeners: Set<() => void>;
    set(params: RouteParams): void;
    subscribe(listener: () => void): () => void;
}

interface Hoisted {
    container: { current: Container | null };
    route: RouteStore;
    buttonActions: { current: ButtonActionConfig[] };
}

const hoisted = vi.hoisted((): Hoisted => {
    const route: RouteStore = {
        params: { modelId: "settings" },
        listeners: new Set(),
        set(params) {
            route.params = params;
            route.listeners.forEach(listener => listener());
        },
        subscribe(listener) {
            route.listeners.add(listener);
            return () => {
                route.listeners.delete(listener);
            };
        }
    };
    return {
        container: { current: null },
        route,
        buttonActions: { current: [] }
    };
});

vi.mock("@webiny/icons/arrow_back.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/info.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/add.svg", () => ({ ReactComponent: () => null }));
vi.mock("react-helmet", () => ({ Helmet: () => null }));

interface ChildrenProps {
    children?: React.ReactNode;
}

interface HeaderBarProps {
    start?: React.ReactNode;
    end?: React.ReactNode;
}

interface ButtonProps {
    text?: string;
    onClick?: () => void;
}

interface ButtonPrimaryProps {
    children?: React.ReactNode;
    onAction?: () => void;
}

interface IconButtonProps {
    "aria-label"?: string;
    onClick?: () => void;
}

interface OverlayLoaderProps {
    text?: string;
}

vi.mock("@webiny/admin-ui", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/admin-ui")>();
    return {
        ...actual,
        Alert: (props: ChildrenProps) => <div role={"alert"}>{props.children}</div>,
        HeaderBar: (props: HeaderBarProps) => (
            <div>
                {props.start}
                {props.end}
            </div>
        ),
        Heading: (props: ChildrenProps) => <h5>{props.children}</h5>,
        Icon: () => null,
        IconButton: (props: IconButtonProps) => (
            <button onClick={props.onClick}>{props["aria-label"]}</button>
        ),
        Tooltip: () => null,
        OverlayLoader: (props: OverlayLoaderProps) => <div>{props.text}</div>,
        Button: (props: ButtonProps) => <button onClick={props.onClick}>{props.text}</button>,
        useToast: () => ({ showSuccessToast: () => undefined })
    };
});

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return {
        ...actual,
        useFeature: (feature: { resolve: (container: Container) => unknown }) => {
            return feature.resolve(hoisted.container.current as Container);
        },
        useRouter: () => ({
            addTransitionGuard: () => () => undefined,
            goToRoute: vi.fn()
        })
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useRoute: () => {
            const params = React.useSyncExternalStore(
                hoisted.route.subscribe,
                () => hoisted.route.params
            );
            return { route: { params } };
        },
        useDialogs: () => ({ showDialog: vi.fn() }),
        Buttons: () => (
            <>
                {hoisted.buttonActions.current.map(action => (
                    <React.Fragment key={action.name}>{action.element}</React.Fragment>
                ))}
            </>
        )
    };
});

vi.mock("~/admin/config/contentEntries/index.js", () => {
    return {
        useContentEntryEditorConfig: () => ({
            buttonActions: hoisted.buttonActions.current,
            menuItemActions: [],
            width: "1020px",
            newEntryWizard: null
        }),
        ContentEntryEditorConfig: {
            Actions: {
                ButtonAction: {
                    useButtons: () => ({
                        ButtonPrimary: (props: ButtonPrimaryProps) => (
                            <button onClick={props.onAction}>{props.children}</button>
                        )
                    })
                }
            }
        }
    };
});

vi.mock("~/admin/config/contentEntries/editor/ContentEntryEditorConfig.js", () => {
    return {
        ContentEntryEditorWithConfig: (props: ChildrenProps) => <>{props.children}</>
    };
});

vi.mock("~/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => ({ canEdit: () => true, canPublish: () => true })
    };
});

vi.mock("~/presentation/contentEntries/list/useContentEntriesPresenter.js", () => {
    return {
        useContentEntriesPresenter: () => ({ selectEntry: vi.fn() })
    };
});

vi.mock("~/presentation/contentEntries/views/layout/index.js", () => {
    return {
        Container: (props: ChildrenProps) => <div>{props.children}</div>,
        ScrollArea: (props: ChildrenProps) => <div>{props.children}</div>,
        ContentEntryFormContent: (props: ChildrenProps) => <div>{props.children}</div>,
        ContentEntryForm: () => <div>{"Entry form"}</div>
    };
});

vi.mock("./RevisionDrawer.js", () => ({ RevisionDrawer: () => null }));
vi.mock("./OlderRevisionAlert.js", () => ({ OlderRevisionAlert: () => null }));

const UNTAGGED = ["singleEntry"];
const TAGGED = ["singleEntry", "$publishing:true"];

const NOT_FOUND = 'Entry "other#0001" was not found.';

const createModel = (tags: string[], withFields = true): CmsModel => {
    const fields = withFields ? [{ fieldId: "title" }] : [];
    return { modelId: "settings", name: "Settings", tags, fields } as unknown as CmsModel;
};

const createRevision = (id: string, locked: boolean, status: string) => {
    return {
        id,
        entryId: id.split("#")[0],
        meta: { locked, status, title: "Settings", version: 1 },
        values: { title: "Hello" }
    };
};

interface SingletonVmState {
    entryId: string | null;
    loading: boolean;
    error: string | null;
    hasFields: boolean;
}

interface SetupOptions {
    tags: string[];
    withFields?: boolean;
    /** What the singleton presenter puts on its view model when `init` runs. */
    onInit?: (state: SingletonVmState, routeEntryId: string | undefined) => void;
    /** The revisions `GetEntryUseCase` returns, by id. Other ids fail with NOT_FOUND. */
    revisions?: Record<string, ReturnType<typeof createRevision>>;
}

const setup = (options: SetupOptions) => {
    const model = createModel(options.tags, options.withFields ?? true);
    const revisions = options.revisions ?? {
        "settings#0001": createRevision("settings#0001", false, "draft")
    };

    const singletonState = observable<SingletonVmState>({
        entryId: null,
        loading: false,
        error: null,
        hasFields: model.fields.length > 0
    });
    const onInit =
        options.onInit ??
        ((state: SingletonVmState, routeEntryId: string | undefined) => {
            state.entryId = routeEntryId ?? null;
        });
    const init: Mock = vi.fn(async (_: CmsModel, routeEntryId: string | undefined) => {
        runInAction(() => onInit(singletonState, routeEntryId));
    });
    const singletonPresenter = {
        get vm() {
            return { ...singletonState };
        },
        init,
        dispose: vi.fn()
    };

    const getEntryExecute: Mock = vi.fn(async ({ id }: { id: string }) => {
        const revision = revisions[id];
        if (!revision) {
            throw new Error(NOT_FOUND);
        }
        return revision;
    });
    const updateExecute: Mock = vi.fn(async ({ revisionId }: { revisionId: string }) => {
        return revisions[revisionId];
    });
    const createRevisionFromExecute: Mock = vi.fn(async () => {
        return createRevision("settings#0002", false, "draft");
    });
    const revisionsInit: Mock = vi.fn(async () => undefined);
    const revisionsDispose: Mock = vi.fn();
    const submit: Mock = vi.fn(async () => ({ title: "Hello" }));

    const container = new Container();
    container.registerInstance(FormModelFactory, {
        create: () => ({
            vm: {},
            isDirty: false,
            submit,
            setData: vi.fn(),
            reset: vi.fn(),
            setErrors: vi.fn()
        })
    } as unknown as FormModelFactory.Interface);
    container.registerInstance(CmsFormModelBuilder, {
        build: () => ({})
    } as unknown as CmsFormModelBuilder.Interface);
    container.registerInstance(CmsModelContext, {
        getModel: () => model
    } as unknown as CmsModelContext.Interface);
    container.registerInstance(GetEntryUseCase, {
        execute: getEntryExecute
    } as unknown as GetEntryUseCase.Interface);
    container.registerInstance(UpdateEntryUseCase, {
        execute: updateExecute
    } as unknown as UpdateEntryUseCase.Interface);
    container.registerInstance(CreateRevisionFromUseCase, {
        execute: createRevisionFromExecute
    } as unknown as CreateRevisionFromUseCase.Interface);
    for (const abstraction of [
        Confirmation,
        CreateEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        DeleteEntryUseCase,
        UpdateRevisionDescriptionUseCase
    ]) {
        container.registerInstance(abstraction as any, {});
    }
    container.register(ContentEntryFormPresenter).inSingletonScope();
    container.registerInstance(RevisionsListPresenter, {
        vm: { loading: false, revisions: [], items: [], visible: false },
        init: revisionsInit,
        dispose: revisionsDispose
    } as unknown as RevisionsListPresenter.Interface);
    container.registerInstance(
        SingletonEditorPresenter,
        singletonPresenter as unknown as SingletonEditorPresenter.Interface
    );
    hoisted.container.current = container;

    // As ContentEntriesModule configures the editor buttons.
    hoisted.buttonActions.current = [
        { name: "save", element: <SaveContentButton /> },
        {
            name: "createRevision",
            element: (
                <IsModelPublishable>
                    <CreateNewRevisionButton />
                </IsModelPublishable>
            )
        },
        {
            name: "publish",
            element: (
                <IsModelPublishable>
                    <SaveAndPublishButton />
                </IsModelPublishable>
            )
        },
        {
            name: "publishOnly",
            element: (
                <IsModelPublishable>
                    <PublishOnlyButton />
                </IsModelPublishable>
            )
        }
    ];

    return {
        model,
        init,
        getEntryExecute,
        updateExecute,
        createRevisionFromExecute,
        revisionsInit,
        submit
    };
};

describe("SingletonEditorView", () => {
    afterEach(() => {
        cleanup();
        hoisted.route.set({ modelId: "settings" });
    });

    it("renders the editor body for the presenter's entry, without list or back button", async () => {
        hoisted.route.set({ modelId: "settings", id: "settings#0001" });
        const { model, init, getEntryExecute } = setup({ tags: UNTAGGED });

        const view = render(<SingletonEditorView model={model} />);

        await view.findByText("Entry form");
        expect(init).toHaveBeenCalledWith(model, "settings#0001");
        expect(getEntryExecute).toHaveBeenCalledWith(
            expect.objectContaining({ id: "settings#0001" })
        );
        expect(view.queryByText("Back")).toBeNull();
        expect(view.queryByText(/New entry/i)).toBeNull();
    });

    it("shows the presenter's error", async () => {
        const { model } = setup({
            tags: UNTAGGED,
            onInit: state => {
                state.error = "Could not load the entry.";
            }
        });

        const view = render(<SingletonEditorView model={model} />);

        expect(await view.findByText("Could not load the entry.")).toBeTruthy();
        expect(view.queryByText("Entry form")).toBeNull();
    });

    it("shows the load error of a foreign revision in place of the form", async () => {
        hoisted.route.set({ modelId: "settings", id: "other#0001" });
        const { model } = setup({ tags: UNTAGGED });

        const view = render(<SingletonEditorView model={model} />);

        expect(await view.findByText(NOT_FOUND)).toBeTruthy();
        expect(view.queryByText("Entry form")).toBeNull();
    });

    it("re-initializes and loads the revision when the route id changes", async () => {
        hoisted.route.set({ modelId: "settings", id: "settings#0001" });
        const { model, init, getEntryExecute } = setup({
            tags: TAGGED,
            revisions: {
                "settings#0001": createRevision("settings#0001", true, "published"),
                "settings#0002": createRevision("settings#0002", false, "draft")
            }
        });

        render(<SingletonEditorView model={model} />);
        await waitFor(() => expect(getEntryExecute).toHaveBeenCalledTimes(1));

        act(() => {
            hoisted.route.set({ modelId: "settings", id: "settings#0002" });
        });

        await waitFor(() => expect(init).toHaveBeenLastCalledWith(model, "settings#0002"));
        await waitFor(() =>
            expect(getEntryExecute).toHaveBeenLastCalledWith(
                expect.objectContaining({ id: "settings#0002" })
            )
        );
    });

    it("shows an empty state for a model without fields", async () => {
        const { model, getEntryExecute } = setup({ tags: UNTAGGED, withFields: false });

        const view = render(<SingletonEditorView model={model} />);

        expect(await view.findByText("This model has no fields.")).toBeTruthy();
        expect(getEntryExecute).not.toHaveBeenCalled();
    });

    it("untagged: shows Save only, and Save updates a locked first revision with validation", async () => {
        hoisted.route.set({ modelId: "settings", id: "settings#0001" });
        const { model, updateExecute, createRevisionFromExecute, submit } = setup({
            tags: UNTAGGED,
            revisions: { "settings#0001": createRevision("settings#0001", true, "published") }
        });

        const view = render(<SingletonEditorView model={model} />);

        const save = await view.findByText("Save");
        expect(view.queryByText("New Revision")).toBeNull();
        expect(view.queryByText("Save & Publish")).toBeNull();
        expect(view.queryByText("Publish")).toBeNull();

        fireEvent.click(save);

        await waitFor(() => expect(updateExecute).toHaveBeenCalledTimes(1));
        expect(updateExecute).toHaveBeenCalledWith(
            expect.objectContaining({
                revisionId: "settings#0001",
                options: { skipValidation: false }
            })
        );
        expect(submit).toHaveBeenCalledWith({ skipValidation: false });
        expect(createRevisionFromExecute).not.toHaveBeenCalled();
    });

    it("tagged: Save skips validation, which runs on publish", async () => {
        hoisted.route.set({ modelId: "settings", id: "settings#0001" });
        const { model, updateExecute } = setup({ tags: TAGGED });

        const view = render(<SingletonEditorView model={model} />);

        fireEvent.click(await view.findByText("Save"));

        await waitFor(() => expect(updateExecute).toHaveBeenCalledTimes(1));
        expect(updateExecute).toHaveBeenCalledWith(
            expect.objectContaining({ options: { skipValidation: true } })
        );
        expect(view.getByText("Save & Publish")).toBeTruthy();
    });
});

describe("ContentEntryEditorBody", () => {
    afterEach(() => {
        cleanup();
    });

    it("loads the given revision and its revisions list, and again when it changes", async () => {
        const { model, getEntryExecute, revisionsInit } = setup({
            tags: TAGGED,
            revisions: {
                "settings#0001": createRevision("settings#0001", false, "draft"),
                "settings#0002": createRevision("settings#0002", false, "draft")
            }
        });

        const view = render(
            <ModelProvider model={model}>
                <ContentEntryEditorBody entryId={"settings#0001"} modelName={"S"} />
            </ModelProvider>
        );
        await waitFor(() =>
            expect(getEntryExecute).toHaveBeenCalledWith(
                expect.objectContaining({ id: "settings#0001" })
            )
        );
        expect(revisionsInit).toHaveBeenCalledWith("settings#0001");

        view.rerender(
            <ModelProvider model={model}>
                <ContentEntryEditorBody entryId={"settings#0002"} modelName={"S"} />
            </ModelProvider>
        );

        await waitFor(() =>
            expect(getEntryExecute).toHaveBeenLastCalledWith(
                expect.objectContaining({ id: "settings#0002" })
            )
        );
        expect(revisionsInit).toHaveBeenLastCalledWith("settings#0002");
    });

    it("shows a back button only when onBack is given", async () => {
        const { model } = setup({ tags: TAGGED });
        const onBack = vi.fn();

        const view = render(
            <ModelProvider model={model}>
                <ContentEntryEditorBody entryId={"settings#0001"} modelName={"S"} onBack={onBack} />
            </ModelProvider>
        );

        fireEvent.click(await view.findByText("Back"));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
