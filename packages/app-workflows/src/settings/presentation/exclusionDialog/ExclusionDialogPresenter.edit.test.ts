import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { NEW_YORK } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import type { ExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";

const ANA_NAME: ExclusionUserName = { userId: "user-ana", label: "Ana Kovač", state: "found" };

const deletedName = (userId: string): ExclusionUserName => {
    return { userId, label: "Deleted user", state: "deleted" };
};

interface OpenEditParams {
    exclusions: WorkflowExclusion[];
    userId: string;
    names?: ExclusionUserName[];
    timeZone?: string;
}

const openEdit = (setup: ExclusionDialogSetup, params: OpenEditParams): FakeExclusionsSource => {
    const source = createFakeExclusionsSource({
        exclusions: params.exclusions,
        timeZone: params.timeZone ?? ZAGREB,
        names: params.names ?? [ANA_NAME]
    });
    setup.presenter.init({ source, mode: "edit", userId: params.userId });
    return source;
};

const sentList = (setup: ExclusionDialogSetup): WorkflowExclusion[] => {
    const [data] = setup.settings.updateSettings.mock.calls[0];
    return data.exclusions;
};

describe("ExclusionDialogPresenter: Edit (R318, R319, R324, D124)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("pre-fills the entry, locks the user and runs no search", () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });
        const vm = setup.presenter.vm;

        expect(vm.title).toBe("Edit exclusion");
        expect(vm.confirmLabel).toBe("Save");
        expect(vm.user).toEqual({
            value: "user-ana",
            selected: {
                id: "user-ana",
                label: "Ana Kovač",
                description: null,
                warning: null,
                muted: false,
                disabled: false,
                icon: "person",
                note: null
            },
            options: [],
            locked: true,
            error: null
        });
        expect(vm.reason).toBe("On leave");
        expect(vm.date).toBe("2026-10-20");
        expect(vm.note).toBeNull();
        expect(setup.config.listUsers).not.toHaveBeenCalled();
    });

    it("ignores searches and picks in Edit", () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });

        setup.presenter.searchUsers("");
        setup.presenter.setUser(null);

        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.presenter.vm.user.value).toBe("user-ana");
    });

    it("keeps the stored instant when the date is unchanged (D124)", async () => {
        openEdit(setup, {
            exclusions: [createAnaExclusion(), createBenExclusion()],
            userId: "user-ana"
        });
        setup.presenter.setReason("Holiday");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            { userId: "user-ana", reason: "Holiday", endsOn: "2026-10-20T21:59:59.999Z" },
            createBenExclusion()
        ]);
    });

    it("keeps a stored instant that is not the end of a local day", async () => {
        // Saved by an admin in New York: 23:59 there is 06:59 the next morning in Zagreb.
        const dan = createExclusion({
            userId: "user-dan",
            reason: null,
            endsOn: "2026-10-21T04:59:00.000Z"
        });
        openEdit(setup, { exclusions: [dan], userId: "user-dan" });
        expect(setup.presenter.vm.date).toBe("2026-10-21");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            { userId: "user-dan", reason: null, endsOn: "2026-10-21T04:59:00.000Z" }
        ]);
    });

    it("recomputes a changed date as the end of that day in the viewer's zone", async () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });

        setup.presenter.setDate("2026-10-22");
        await setup.presenter.submit();

        expect(sentList(setup)[0].endsOn).toBe("2026-10-22T21:59:59.999Z");
    });

    it("recomputes a changed date on the New York DST change day", async () => {
        const eve = createExclusion({
            userId: "user-eve",
            reason: null,
            endsOn: "2026-10-31T03:59:59.999Z"
        });
        openEdit(setup, { exclusions: [eve], userId: "user-eve", timeZone: NEW_YORK });
        expect(setup.presenter.vm.date).toBe("2026-10-30");

        setup.presenter.setDate("2026-11-01");
        await setup.presenter.submit();

        expect(sentList(setup)[0].endsOn).toBe("2026-11-02T04:59:59.999Z");
    });

    it("sends null when the date is cleared", async () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });

        setup.presenter.clearDate();
        await setup.presenter.submit();

        expect(sentList(setup)[0].endsOn).toBeNull();
    });

    it("replaces the entry in place and keeps the others in order (R318)", async () => {
        openEdit(setup, {
            exclusions: [createAnaExclusion(), createBenExclusion(), createCidExclusion()],
            userId: "user-ben"
        });
        setup.presenter.setReason("Moved");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            createAnaExclusion(),
            { userId: "user-ben", reason: "Moved", endsOn: null },
            createCidExclusion()
        ]);
    });

    it("keeps an expired entry's past date and blocks only a changed past date (QBZ-30)", async () => {
        openEdit(setup, { exclusions: [createCidExclusion()], userId: "user-cid" });
        expect(setup.presenter.vm.date).toBe("2026-10-10");
        expect(setup.presenter.vm.dateError).toBeNull();

        setup.presenter.setDate("2026-10-15");
        expect(setup.presenter.vm.dateError).toBe("Pick today or a later date.");
        await setup.presenter.submit();
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();

        setup.presenter.setDate("2026-10-19");
        expect(setup.presenter.vm.dateError).toBeNull();

        setup.presenter.setDate("2026-10-10");
        expect(setup.presenter.vm.dateError).toBeNull();
        await setup.presenter.submit();
        expect(sentList(setup)).toEqual([createCidExclusion()]);
    });

    it("shows the expired note for an entry that had expired when the dialog opened", () => {
        openEdit(setup, { exclusions: [createCidExclusion()], userId: "user-cid" });

        expect(setup.presenter.vm.note).toEqual({
            kind: "expired",
            text: "This exclusion has expired. Keep the date to change only the reason, or pick a new date to make it active again."
        });
    });

    it("shows the deleted-user note, which wins over the expired note (R324)", () => {
        openEdit(setup, {
            exclusions: [createCidExclusion()],
            userId: "user-cid",
            names: [deletedName("user-cid")]
        });

        expect(setup.presenter.vm.note).toEqual({
            kind: "deletedUser",
            text: "This user was deleted, so the entry has no effect. Remove it."
        });
    });

    it("shows a deleted user as a muted, locked Deleted user (QBZ-91)", () => {
        openEdit(setup, {
            exclusions: [createBenExclusion()],
            userId: "user-ben",
            names: [deletedName("user-ben")]
        });

        expect(setup.presenter.vm.user.selected).toMatchObject({
            id: "user-ben",
            label: "Deleted user",
            muted: true,
            icon: "person_off"
        });
        expect(setup.presenter.vm.user.locked).toBe(true);
    });

    it("saves a deleted user's entry with a changed reason and date (Q64)", async () => {
        openEdit(setup, {
            exclusions: [createAnaExclusion(), createBenExclusion()],
            userId: "user-ben",
            names: [deletedName("user-ben")]
        });
        setup.presenter.setReason("Left the company");
        setup.presenter.setDate("2026-10-30");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            createAnaExclusion(),
            { userId: "user-ben", reason: "Left the company", endsOn: "2026-10-30T22:59:59.999Z" }
        ]);
    });

    it("asks the page to open the Remove dialog for Remove entry (R324)", () => {
        const source = openEdit(setup, {
            exclusions: [createBenExclusion()],
            userId: "user-ben",
            names: [deletedName("user-ben")]
        });

        setup.presenter.removeEntry();

        expect(source.openRemove).toHaveBeenCalledWith("user-ben");
    });

    it("hands the saved record to the page without a user, toasts and closes (R327)", async () => {
        const source = openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });
        const saved = { exclusions: [createAnaExclusion()] };
        setup.settings.updateSettings.mockResolvedValueOnce(saved);

        await setup.presenter.submit();

        expect(source.applySaved).toHaveBeenCalledWith({
            settings: saved,
            change: "edit",
            user: null
        });
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.toasts.success).toHaveBeenCalledWith("Exclusion updated");
    });
});
