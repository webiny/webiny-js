import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/app";
import { DiContainerProvider } from "@webiny/app";
import { useContainer } from "@webiny/app";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { AdminUiProvider } from "@webiny/admin-ui";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { DialogsProvider } from "@webiny/app-admin/components/Dialogs/DialogsContext.js";
import { ConfirmationBridge } from "@webiny/app-admin/features/confirmation/index.js";
import { ConfirmationFeature } from "@webiny/app-admin/features/confirmation/feature.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { AdminConfig } from "@webiny/app-admin";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollector/abstractions.js";
import { ActiveReviewGuard } from "./ActiveReviewGuard/abstractions.js";
import { ActiveReviewWarningPresenter } from "./ActiveReviewWarningPresenter/abstractions.js";
import { ActiveReviewTrashFeature } from "./feature.js";
import { ActiveReviewWarningConfig } from "./components/ActiveReviewWarningConfig.js";
import { WorkflowsAdminApp } from "~/app.js";

const flags = vi.hoisted(() => ({ enabled: true }));

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useFeatureFlags: () => ({ isEnabled: () => flags.enabled })
    };
});

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

function findElements(
    node: React.ReactNode,
    predicate: (element: React.ReactElement) => boolean
): React.ReactElement[] {
    const found: React.ReactElement[] = [];
    React.Children.forEach(node, child => {
        if (!React.isValidElement(child)) {
            return;
        }
        if (predicate(child)) {
            found.push(child);
        }
        const props = child.props as { children?: React.ReactNode };
        found.push(...findElements(props.children, predicate));
    });
    return found;
}

describe("ActiveReviewTrashFeature", () => {
    it("registers the collector and the guard as singletons and the presenter as transient", () => {
        const container = new Container();
        container.registerInstance(Confirmation, {
            confirm: vi.fn()
        } as unknown as Confirmation.Interface);
        container.registerInstance(Notifications, {
            notify: vi.fn(),
            success: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
            getNotifications: vi.fn(),
            remove: vi.fn()
        });
        ActiveReviewTrashFeature.register(container);

        expect(container.resolve(ActiveReviewGuard)).toBe(container.resolve(ActiveReviewGuard));
        expect(container.resolve(ActiveReviewBlockCollector)).toBe(
            container.resolve(ActiveReviewBlockCollector)
        );
        expect(container.resolve(ActiveReviewWarningPresenter)).not.toBe(
            container.resolve(ActiveReviewWarningPresenter)
        );
    });

    it("the guard and the collector the container hands out share one collector", async () => {
        const confirm = vi.fn();
        const container = new Container();
        container.registerInstance(Confirmation, {
            confirm
        } as unknown as Confirmation.Interface);
        container.registerInstance(Notifications, {
            notify: vi.fn(),
            success: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
            getNotifications: vi.fn(),
            remove: vi.fn()
        });
        ActiveReviewTrashFeature.register(container);
        const guard = container.resolve(ActiveReviewGuard);
        const collector = container.resolve(ActiveReviewBlockCollector);
        const runId = collector.begin(["entry-1"]);
        const data: ActiveReviewOnTrashData = {
            model: "cms.article",
            action: "trash",
            reviews: [
                {
                    reviewId: "review-1",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    title: "Launch article",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Editor"
                }
            ]
        };
        const refusal = new GraphQLOperationError({
            message: "Refused.",
            code: ReviewErrorCode.ActiveReviewOnTrash,
            data
        });

        await guard
            .run({
                action: async () => {
                    throw refusal;
                },
                useCases: {
                    cancelForDelete: vi.fn(async () => []),
                    listBlockingReviews: vi.fn(async () => [])
                },
                revisionId: null
            })
            .catch(() => undefined);

        collector.end(runId);
        expect(collector.drain(runId)).toHaveLength(1);
        expect(confirm).not.toHaveBeenCalled();
    });
});

describe("WorkflowsAdminApp (composition root)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("registers the feature and the dialog when the flag is on", () => {
        const tree = WorkflowsAdminApp();

        const features = findElements(tree, element => {
            const props = element.props as { feature?: unknown };
            return props.feature === ActiveReviewTrashFeature;
        });
        const dialogs = findElements(tree, element => element.type === ActiveReviewWarningConfig);
        expect(features).toHaveLength(1);
        expect(dialogs).toHaveLength(1);
    });

    it("registers nothing when the flag is off", () => {
        flags.enabled = false;

        expect(WorkflowsAdminApp()).toBeNull();
    });
});

/**
 * A71: a second named dialog opened while the first dialog's `execute` is still running replaces
 * the first one in the real host. verify: if rendering the real `DialogsProvider` needs another
 * provider than the ones below, add it here and name it in the commit; the assertions are the point.
 */
describe("A71: the named-dialog host", () => {
    const FIRST_DIALOG = "test-first-dialog";

    const FirstDialog = () => {
        const { onConfirm, onCancel, closeDialog } = useNamedConfirmationDialog();

        return (
            <div>
                <span>First dialog</span>
                <button
                    onClick={async () => {
                        await onConfirm();
                        closeDialog();
                    }}
                >
                    First confirm
                </button>
                <button
                    onClick={() => {
                        onCancel();
                        closeDialog();
                    }}
                >
                    First cancel
                </button>
            </div>
        );
    };

    interface RunnerProps {
        run: (container: Container) => Promise<void>;
    }

    const Runner = ({ run }: RunnerProps) => {
        const container = useContainer();
        return <button onClick={() => run(container)}>Trash</button>;
    };

    function createRefusal() {
        const data: ActiveReviewOnTrashData = {
            model: "cms.article",
            action: "trash",
            reviews: [
                {
                    reviewId: "review-1",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    title: "Launch article",
                    stepPosition: 2,
                    stepCount: 3,
                    stepName: "Legal"
                }
            ]
        };
        return new GraphQLOperationError({
            message: "Refused.",
            code: ReviewErrorCode.ActiveReviewOnTrash,
            data
        });
    }

    function renderHost() {
        const container = new Container();
        ConfirmationFeature.register(container);
        container.registerInstance(Notifications, {
            notify: vi.fn(),
            success: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
            getNotifications: vi.fn(),
            remove: vi.fn()
        });
        ActiveReviewTrashFeature.register(container);
        const useCases = {
            cancelForDelete: vi.fn(async () => []),
            listBlockingReviews: vi.fn(async () => [])
        };
        const results: unknown[] = [];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal();
            }
            return "trashed";
        });
        useCases.cancelForDelete.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        const run = async (resolver: Container) => {
            const confirmation = resolver.resolve(Confirmation);
            const guard = resolver.resolve(ActiveReviewGuard);
            const result = await confirmation.confirm(FIRST_DIALOG, {}, () =>
                guard.run({ action, useCases, revisionId: null })
            );
            results.push(result);
        };

        render(
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <CompositionProvider>
                        <AdminWithConfig>
                            <AdminConfig>
                                <AdminConfig.Dialog name={FIRST_DIALOG} element={<FirstDialog />} />
                            </AdminConfig>
                            <ActiveReviewWarningConfig />
                            {AdminConfigPlugin}
                            <DialogsProvider>
                                <ConfirmationBridge />
                                <Runner run={run} />
                            </DialogsProvider>
                        </AdminWithConfig>
                    </CompositionProvider>
                </DiContainerProvider>
            </AdminUiProvider>
        );

        return { useCases, action, results };
    }

    afterEach(() => {
        cleanup();
    });

    it("replaces the first dialog with the warning, then resolves the original confirmation after the repeat", async () => {
        const { useCases, action, results } = renderHost();

        fireEvent.click(screen.getByRole("button", { name: "Trash" }));
        fireEvent.click(await screen.findByRole("button", { name: "First confirm" }));

        expect(await screen.findByText("Review in progress")).toBeTruthy();
        expect(screen.queryByText("First dialog")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

        await waitFor(() => expect(results).toEqual(["trashed"]));
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(screen.queryByText("Review in progress")).toBeNull());
    });

    it("resolves the original confirmation with false when the warning is dismissed", async () => {
        const { useCases, action, results } = renderHost();

        fireEvent.click(screen.getByRole("button", { name: "Trash" }));
        fireEvent.click(await screen.findByRole("button", { name: "First confirm" }));
        await screen.findByText("Review in progress");

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        await waitFor(() => expect(results).toEqual([false]));
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(action).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByText("Review in progress")).toBeNull());
    });
});
