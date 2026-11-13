import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { makeAutoObservable } from "mobx";

interface StoredUser {
    id: string;
    firstName: string;
}

interface PendingRead {
    id: string;
    resolve: (user: StoredUser) => void;
}

const mocks = vi.hoisted(() => {
    const pending: PendingRead[] = [];
    return {
        pending,
        params: {} as { id?: string },
        getUser: {
            execute: ({ id }: { id: string }) =>
                new Promise(resolve => {
                    pending.push({ id, resolve });
                })
        },
        // Set in the test body: makeAutoObservable is not available inside vi.hoisted.
        revision: undefined as unknown as {
            user(id: string): number;
            userChanged(id: string): void;
        }
    };
});

vi.mock("@webiny/app", async importOriginal => ({
    ...(await importOriginal<object>()),
    useFeature: (feature: { name: string }) => {
        if (feature.name === "AdminUsers/GetUser") {
            return { useCase: mocks.getUser };
        }
        if (feature.name === "AdminUsers/UserEvents") {
            return { revision: mocks.revision };
        }
        return { useCase: { execute: vi.fn() } };
    },
    useRoute: () => ({ route: { params: mocks.params } }),
    useRouter: () => ({ goToRoute: vi.fn() })
}));

vi.mock("@webiny/admin-ui", () => ({
    useToast: () => ({ showSuccessToast: vi.fn(), showWarningToast: vi.fn() })
}));

import { useUserForm } from "./useUserForm.js";

class Revision {
    private users = new Map<string, number>();

    constructor() {
        makeAutoObservable(this);
    }

    user(id: string): number {
        return this.users.get(id) ?? 0;
    }

    userChanged(id: string): void {
        this.users.set(id, this.user(id) + 1);
    }
}

// Resolves the oldest still-pending read of `id`, or the newest one with `newest`.
const finishRead = async (id: string, user: StoredUser, newest = false) => {
    const reads = mocks.pending.filter(read => read.id === id);
    const read = newest ? reads[reads.length - 1] : reads[0];
    mocks.pending.splice(mocks.pending.indexOf(read), 1);
    await act(async () => {
        read.resolve(user);
    });
};

describe("useUserForm", () => {
    afterEach(() => {
        cleanup();
        mocks.pending.length = 0;
    });

    it("keeps the newly opened user when a refresh of the previous one finishes late", async () => {
        mocks.revision = new Revision();
        mocks.params.id = "a";
        const { result, rerender } = renderHook(() => useUserForm());
        await finishRead("a", { id: "a", firstName: "Ann" });

        // A change to user a arrives and its read starts; then the admin opens user b.
        act(() => mocks.revision.userChanged("a"));
        mocks.params.id = "b";
        rerender();
        await finishRead("b", { id: "b", firstName: "Bob" });
        await finishRead("a", { id: "a", firstName: "Ann (changed)" });

        expect(result.current.user).toEqual({ id: "b", firstName: "Bob" });
    });

    it("keeps the newest read when two refreshes of the same user finish out of order", async () => {
        mocks.revision = new Revision();
        mocks.params.id = "a";
        const { result } = renderHook(() => useUserForm());
        await finishRead("a", { id: "a", firstName: "Ann" });

        act(() => mocks.revision.userChanged("a"));
        act(() => mocks.revision.userChanged("a"));
        await finishRead("a", { id: "a", firstName: "Second" }, true);
        await finishRead("a", { id: "a", firstName: "First" });

        expect(result.current.user).toEqual({ id: "a", firstName: "Second" });
    });
});
