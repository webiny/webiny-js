/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LockStatusView } from "./LockStatusView.js";
import type { IRecordLockingViewModel } from "../abstractions.js";

const hoisted = vi.hoisted(() => ({
    goBack: vi.fn(),
    goToRoute: vi.fn()
}));

vi.mock("@webiny/app", async importOriginal => ({
    ...(await importOriginal<object>()),
    useRouter: () => ({ goBack: hoisted.goBack, goToRoute: hoisted.goToRoute })
}));

vi.mock("@webiny/app-admin", async importOriginal => ({
    ...(await importOriginal<object>()),
    useSnackbar: () => ({ showSnackbar: vi.fn() }),
    useConfirmationDialog: () => ({
        showConfirmation: (callback: () => Promise<void>) => callback()
    })
}));

const createVm = (status: IRecordLockingViewModel["status"]): IRecordLockingViewModel => ({
    status,
    lockRecord: null,
    lockedByUserName: null,
    canForceUnlock: true,
    canEdit: false
});

const hasFixedAncestor = (element: HTMLElement) => {
    let current: HTMLElement | null = element;
    while (current) {
        if (current.classList.contains("fixed")) {
            return true;
        }
        current = current.parentElement;
    }
    return false;
};

const renderView = (status: IRecordLockingViewModel["status"], isSingleton: boolean) => {
    return render(
        <LockStatusView
            vm={createVm(status)}
            isSingleton={isSingleton}
            entryTitle="Settings"
            onForceUnlock={async () => true}
        >
            <div>content</div>
        </LockStatusView>
    );
};

describe("LockStatusView", () => {
    beforeEach(() => {
        hoisted.goBack.mockClear();
        hoisted.goToRoute.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it("renders the content when the record is not locked", () => {
        renderView("acquired", true);

        expect(screen.getByText("content")).toBeTruthy();
    });

    it("covers the whole screen while checking a regular model", () => {
        renderView("checking", false);

        expect(hasFixedAncestor(screen.getByText("Checking record status..."))).toBe(true);
    });

    it("keeps the checking loader inside the layout for a singleton", () => {
        renderView("checking", true);

        expect(hasFixedAncestor(screen.getByText("Checking record status..."))).toBe(false);
    });

    it("keeps the locked overlay inside the layout for a singleton", () => {
        renderView("locked", true);

        expect(hasFixedAncestor(screen.getByText("Record (Settings) is locked!"))).toBe(false);
    });

    it("goes back after unlocking a regular model", async () => {
        renderView("locked", false);

        fireEvent.click(screen.getByText("Unlock and go back"));

        await waitFor(() => expect(hoisted.goBack).toHaveBeenCalledTimes(1));
        expect(hoisted.goToRoute).not.toHaveBeenCalled();
    });

    it("goes to the models list after unlocking a singleton", async () => {
        renderView("locked", true);

        fireEvent.click(screen.getByText("Unlock and go back"));

        await waitFor(() => expect(hoisted.goToRoute).toHaveBeenCalledTimes(1));
        expect(hoisted.goBack).not.toHaveBeenCalled();
    });
});
