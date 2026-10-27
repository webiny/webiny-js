import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { TOKYO } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import type { ExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";

const ANA_USER = createWorkflowUserSummary({
    id: "user-ana",
    displayName: "Ana Kovač",
    teamIds: []
});
const IVAN = createWorkflowUserSummary({
    id: "user-ivan",
    displayName: "Ivan Horvat",
    teamIds: []
});

const createList = (): WorkflowExclusion[] => {
    return [createAnaExclusion(), createBenExclusion()];
};

const openAdd = async (
    setup: ExclusionDialogSetup,
    timeZone = ZAGREB
): Promise<FakeExclusionsSource> => {
    const source = createFakeExclusionsSource({ exclusions: createList(), timeZone });
    setup.presenter.init({ source, mode: "add", userId: null });
    await vi.waitFor(() => expect(setup.presenter.vm.user.options).toHaveLength(2));
    return source;
};

describe("ExclusionDialogPresenter: Add (R318, R324, R327, R328)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
        setup.listWorkflowUsers.execute.mockResolvedValue({
            users: [ANA_USER, IVAN],
            missingIds: []
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("opens empty with the Add copy and runs the empty search at once", async () => {
        await openAdd(setup);
        const vm = setup.presenter.vm;

        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: null,
            ids: null,
            teamIds: null,
            limit: 50
        });
        expect(vm.title).toBe("Add exclusion");
        expect(vm.confirmLabel).toBe("Add exclusion");
        expect(vm.user.value).toBeNull();
        expect(vm.user.selected).toBeNull();
        expect(vm.user.locked).toBe(false);
        expect(vm.user.error).toBeNull();
        expect(vm.reason).toBe("");
        expect(vm.date).toBeNull();
        expect(vm.dateError).toBeNull();
        expect(vm.showClear).toBe(false);
        expect(vm.note).toBeNull();
        expect(vm.alert).toBeNull();
        expect(vm.saving).toBe(false);
    });

    it("names the viewer's zone in the date hint (R324)", async () => {
        await openAdd(setup);

        expect(setup.presenter.vm.dateHint).toBe(
            "Optional. The exclusion ends at the end of that day (Europe/Zagreb). Leave empty to keep it until you remove it."
        );
    });

    it("disables users already in the list with the note In the list (Q64)", async () => {
        await openAdd(setup);

        expect(setup.presenter.vm.user.options).toEqual([
            {
                id: "user-ana",
                label: "Ana Kovač",
                description: null,
                warning: null,
                muted: false,
                disabled: true,
                icon: "person",
                note: "In the list"
            },
            {
                id: "user-ivan",
                label: "Ivan Horvat",
                description: null,
                warning: null,
                muted: false,
                disabled: false,
                icon: "person",
                note: null
            }
        ]);
    });

    it("ignores a pick of a user who is already in the list", async () => {
        await openAdd(setup);

        setup.presenter.setUser("user-ana");

        expect(setup.presenter.vm.user.value).toBeNull();
    });

    it("shows the picked user as the selected option", async () => {
        await openAdd(setup);

        setup.presenter.setUser("user-ivan");

        expect(setup.presenter.vm.user.value).toBe("user-ivan");
        expect(setup.presenter.vm.user.selected).toMatchObject({
            id: "user-ivan",
            label: "Ivan Horvat",
            disabled: false,
            note: null
        });
    });

    it("sends the last-loaded list plus the new entry, appended (R318)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");
        setup.presenter.setReason("  Holiday  ");
        setup.presenter.setDate("2026-10-24");

        await setup.presenter.submit();

        expect(setup.updateWorkflowSettings.execute).toHaveBeenCalledTimes(1);
        expect(setup.updateWorkflowSettings.execute).toHaveBeenCalledWith({
            exclusions: [
                createAnaExclusion(),
                createBenExclusion(),
                { userId: "user-ivan", reason: "Holiday", endsOn: "2026-10-24T21:59:59.999Z" }
            ]
        });
    });

    it("sends a whitespace-only reason and no date as null (Q65)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");
        setup.presenter.setReason("   ");

        await setup.presenter.submit();

        const sent = setup.updateWorkflowSettings.execute.mock.calls[0][0];
        expect(sent.exclusions[2]).toEqual({ userId: "user-ivan", reason: null, endsOn: null });
    });

    it("cuts a pasted reason to 500 characters after trimming (R328)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");
        const letters = "a".repeat(520);
        const pasted = ` ${letters}`;
        setup.presenter.setReason(pasted);

        await setup.presenter.submit();

        const sent = setup.updateWorkflowSettings.execute.mock.calls[0][0];
        expect(sent.exclusions[2].reason).toHaveLength(500);
    });

    it("asks for a user on submit without one and clears the error on a pick", async () => {
        await openAdd(setup);

        await setup.presenter.submit();

        expect(setup.presenter.vm.user.error).toBe("Choose a user.");
        expect(setup.updateWorkflowSettings.execute).not.toHaveBeenCalled();

        setup.presenter.setUser("user-ivan");
        expect(setup.presenter.vm.user.error).toBeNull();
    });

    it("hands the saved record and the picked user to the page, toasts and closes (R318, R327)", async () => {
        const source = await openAdd(setup);
        const saved = {
            exclusions: [
                createAnaExclusion(),
                createBenExclusion(),
                { userId: "user-ivan", reason: null, endsOn: null }
            ]
        };
        setup.updateWorkflowSettings.execute.mockResolvedValueOnce(saved);
        setup.presenter.setUser("user-ivan");

        await setup.presenter.submit();

        expect(source.applySaved).toHaveBeenCalledWith({
            settings: saved,
            change: "add",
            user: IVAN
        });
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.toasts.success).toHaveBeenCalledWith("Exclusion added");
        expect(setup.toasts.error).not.toHaveBeenCalled();
    });

    it("offers today in the viewer's zone as the earliest day, at local midnight (R319, R337)", async () => {
        await openAdd(setup);

        const minDate = setup.presenter.vm.minDate;
        expect(minDate).toBeInstanceOf(Date);
        expect(minDate.getFullYear()).toBe(2026);
        expect(minDate.getMonth()).toBe(9);
        expect(minDate.getDate()).toBe(19);
        expect(minDate.getHours()).toBe(0);
        expect(minDate.getMinutes()).toBe(0);
    });

    it("takes today from the viewer's zone, not from UTC", async () => {
        // 20:00 UTC on 19 Oct is already 05:00 on 20 Oct in Tokyo.
        vi.setSystemTime(Date.parse("2026-10-19T20:00:00.000Z"));
        await openAdd(setup, TOKYO);

        expect(setup.presenter.vm.minDate.getDate()).toBe(20);
    });

    it("shows Clear only while a date is set and reads an empty date as none", async () => {
        await openAdd(setup);

        setup.presenter.setDate("2026-10-24");
        expect(setup.presenter.vm.date).toBe("2026-10-24");
        expect(setup.presenter.vm.showClear).toBe(true);

        setup.presenter.clearDate();
        expect(setup.presenter.vm.date).toBeNull();
        expect(setup.presenter.vm.showClear).toBe(false);

        setup.presenter.setDate("2026-10-24");
        setup.presenter.setDate("");
        expect(setup.presenter.vm.date).toBeNull();
    });

    it("blocks a past day in Add (the date is new, so it counts as changed)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");

        setup.presenter.setDate("2026-10-18");

        expect(setup.presenter.vm.dateError).toBe("Pick today or a later date.");
        await setup.presenter.submit();
        expect(setup.updateWorkflowSettings.execute).not.toHaveBeenCalled();
    });
});

describe("ExclusionDialogPresenter: user search (R324, R325)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
        setup.listWorkflowUsers.execute.mockResolvedValue({
            users: [ANA_USER, IVAN],
            missingIds: []
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("debounces a typed search by 250 ms and sends the last text", async () => {
        await openAdd(setup);
        setup.listWorkflowUsers.execute.mockClear();

        setup.presenter.searchUsers("iv");
        setup.presenter.searchUsers("iva");
        vi.advanceTimersByTime(249);
        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledTimes(1);
        expect(setup.listWorkflowUsers.execute).toHaveBeenCalledWith({
            search: "iva",
            ids: null,
            teamIds: null,
            limit: 50
        });
    });

    it("drops the answer of an older search", async () => {
        await openAdd(setup);
        const older = createDeferred<WorkflowUserList>();
        setup.listWorkflowUsers.execute.mockReturnValueOnce(older.promise);
        setup.listWorkflowUsers.execute.mockResolvedValueOnce({ users: [IVAN], missingIds: [] });

        setup.presenter.searchUsers("a");
        vi.advanceTimersByTime(250);
        setup.presenter.searchUsers("iv");
        vi.advanceTimersByTime(250);
        await vi.waitFor(() => expect(setup.presenter.vm.user.options).toHaveLength(1));
        older.resolve({ users: [ANA_USER, IVAN], missingIds: [] });
        await older.promise;
        await Promise.resolve();

        expect(setup.presenter.vm.user.options.map(option => option.id)).toEqual(["user-ivan"]);
    });

    it("shows Could not load users. when a search fails and clears it with the next search", async () => {
        await openAdd(setup);
        setup.listWorkflowUsers.execute.mockRejectedValueOnce(new Error("Network down."));

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.vm.user.error).toBe("Could not load users."));

        // The retry answers a different list than the first load, so its answer shows.
        setup.listWorkflowUsers.execute.mockResolvedValueOnce({ users: [IVAN], missingIds: [] });
        setup.presenter.searchUsers("");
        await vi.waitFor(() => {
            const ids = setup.presenter.vm.user.options.map(option => option.id);
            expect(ids).toEqual(["user-ivan"]);
        });
        expect(setup.presenter.vm.user.error).toBeNull();
    });

    it("drops a pending search on dispose", async () => {
        await openAdd(setup);
        setup.listWorkflowUsers.execute.mockClear();

        setup.presenter.searchUsers("iv");
        setup.presenter.dispose();
        vi.advanceTimersByTime(250);

        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();
    });
});
