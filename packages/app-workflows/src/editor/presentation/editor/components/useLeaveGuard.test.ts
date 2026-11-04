import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLeaveGuard } from "./useLeaveGuard.js";

interface DirtyProps {
    dirty: boolean;
}

interface NameProps {
    name: string;
}

interface GuardConfig {
    guard(): boolean;
    onBlocked(): void;
}

interface DialogConfig {
    title: string;
    content: string;
    acceptLabel: string;
    cancelLabel: string;
    onAccept(): void;
    onClose(): void;
}

const router = vi.hoisted(() => ({
    addTransitionGuard: vi.fn(),
    confirmTransition: vi.fn(),
    cancelTransition: vi.fn()
}));

const dialogs = vi.hoisted(() => ({ showDialog: vi.fn() }));

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return { ...actual, useRouter: () => router };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useDialogs: () => dialogs };
});

const dispose = vi.fn();

const registeredGuard = (): GuardConfig => {
    return router.addTransitionGuard.mock.calls[0][0] as GuardConfig;
};

const shownDialog = (): DialogConfig => {
    return dialogs.showDialog.mock.calls[0][0] as DialogConfig;
};

const dispatchBeforeUnload = (): Event => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event;
};

describe("useLeaveGuard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        router.addTransitionGuard.mockReturnValue(dispose);
    });

    it("registers one transition guard and disposes it on unmount", () => {
        const { rerender, unmount } = renderHook(
            (props: DirtyProps) => useLeaveGuard(props.dirty, "Article review"),
            { initialProps: { dirty: false } }
        );

        rerender({ dirty: true });
        rerender({ dirty: false });

        expect(router.addTransitionGuard).toHaveBeenCalledTimes(1);
        expect(dispose).not.toHaveBeenCalled();
        unmount();
        expect(dispose).toHaveBeenCalledTimes(1);
    });

    it("blocks a transition only while the latest draft is dirty", () => {
        const { rerender } = renderHook(
            (props: DirtyProps) => useLeaveGuard(props.dirty, "Article review"),
            { initialProps: { dirty: false } }
        );
        const config = registeredGuard();

        expect(config.guard()).toBe(false);
        rerender({ dirty: true });
        expect(config.guard()).toBe(true);
        rerender({ dirty: false });
        expect(config.guard()).toBe(false);
    });

    it("asks Discard unsaved changes? with the workflow's name", () => {
        renderHook(() => useLeaveGuard(true, "Article review"));

        registeredGuard().onBlocked();

        expect(dialogs.showDialog).toHaveBeenCalledTimes(1);
        const dialog = shownDialog();
        expect(dialog.title).toBe("Discard unsaved changes?");
        expect(dialog.content).toBe(
            "You have unsaved changes to “Article review”. If you leave this workflow now, they are lost."
        );
        expect(dialog.acceptLabel).toBe("Discard changes");
        expect(dialog.cancelLabel).toBe("Keep editing");
    });

    it("names an unnamed workflow as this workflow", () => {
        renderHook(() => useLeaveGuard(true, ""));

        registeredGuard().onBlocked();

        expect(shownDialog().content).toBe(
            "You have unsaved changes to “this workflow”. If you leave this workflow now, they are lost."
        );
    });

    it("uses the latest name in the dialog", () => {
        const { rerender } = renderHook((props: NameProps) => useLeaveGuard(true, props.name), {
            initialProps: { name: "Article review" }
        });
        rerender({ name: "Article sign-off" });

        registeredGuard().onBlocked();

        expect(shownDialog().content).toContain("“Article sign-off”");
    });

    it("confirms the transition on accept and does not cancel it when the dialog then closes", () => {
        renderHook(() => useLeaveGuard(true, "Article review"));
        registeredGuard().onBlocked();
        const dialog = shownDialog();

        dialog.onAccept();
        dialog.onClose();
        dialog.onClose();

        expect(router.confirmTransition).toHaveBeenCalledTimes(1);
        expect(router.cancelTransition).not.toHaveBeenCalled();
    });

    it("cancels the transition when the dialog closes without accepting", () => {
        renderHook(() => useLeaveGuard(true, "Article review"));
        registeredGuard().onBlocked();

        shownDialog().onClose();

        expect(router.cancelTransition).toHaveBeenCalled();
        expect(router.confirmTransition).not.toHaveBeenCalled();
    });

    it("asks the browser to confirm closing the tab only while dirty", () => {
        const { rerender } = renderHook(
            (props: DirtyProps) => useLeaveGuard(props.dirty, "Article review"),
            { initialProps: { dirty: false } }
        );

        expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

        rerender({ dirty: true });
        expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

        rerender({ dirty: false });
        expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });

    it("removes the beforeunload listener on unmount", () => {
        const { unmount } = renderHook(() => useLeaveGuard(true, "Article review"));

        expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
        unmount();
        expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });
});
