import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";

const MANAGE = { canManage: true, timeZone: ZAGREB };

const expectNoDialogOpens = (presenter: ExclusionsPagePresenter.Interface): void => {
    presenter.openAdd();
    presenter.openEdit("user-ana");
    presenter.openRemove("user-ana");
    expect(presenter.vm.dialog).toBeNull();
};

describe("ExclusionsPagePresenter: dialog gate (R329, Review Focus 1)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("offers no Add and opens no dialog while the list loads", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup([
            createAnaExclusion()
        ]);
        const pending = createDeferred<WorkflowSettings>();
        getWorkflowSettings.execute.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);

        expect(presenter.vm.canAdd).toBe(false);
        expectNoDialogOpens(presenter);
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await init;
    });

    it("offers no Add and opens no dialog after a failed load", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup([
            createAnaExclusion()
        ]);
        getWorkflowSettings.execute.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.canAdd).toBe(false);
        expectNoDialogOpens(presenter);
    });

    it("offers no Add and opens no dialog without access", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);

        await presenter.init({ canManage: false, timeZone: ZAGREB });

        expect(presenter.vm.canAdd).toBe(false);
        expectNoDialogOpens(presenter);
    });

    it("opens Add, Edit and Remove once the list is loaded, and closes them", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);

        presenter.openAdd();
        expect(presenter.vm.dialog).toEqual({ kind: "add", userId: null });

        presenter.openEdit("user-ana");
        expect(presenter.vm.dialog).toEqual({ kind: "edit", userId: "user-ana" });

        presenter.openRemove("user-ana");
        expect(presenter.vm.dialog).toEqual({ kind: "remove", userId: "user-ana" });

        presenter.closeDialog();
        expect(presenter.vm.dialog).toBeNull();
    });

    it("opens no Edit or Remove for a user who is not in the list", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);

        presenter.openEdit("user-zed");
        presenter.openRemove("user-zed");

        expect(presenter.vm.dialog).toBeNull();
    });
});

describe("ExclusionsPagePresenter: the dialogs' source (R318, R322, R337)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("hands out the loaded list itself, the zone and the user names", async () => {
        const list = [createAnaExclusion()];
        const { presenter } = createExclusionsPageSetup(list);
        await presenter.init(MANAGE);

        expect(presenter.getExclusions()).toBe(list);
        expect(presenter.getTimeZone()).toBe(ZAGREB);
        expect(presenter.getUserName("user-ana")).toEqual({
            userId: "user-ana",
            label: "user-ana",
            state: "unknown"
        });
    });

    it("adopts the saved record after an add, selects Active and knows the picked user", async () => {
        const { presenter } = createExclusionsPageSetup([
            createAnaExclusion(),
            createCidExclusion()
        ]);
        await presenter.init(MANAGE);
        presenter.setTab("expired");
        const dan = createWorkflowUserSummary({ id: "user-dan", displayName: "Dan Novak" });
        const saved = {
            exclusions: [
                createAnaExclusion(),
                createCidExclusion(),
                { userId: "user-dan", reason: null, endsOn: null }
            ]
        };

        presenter.applySaved({ settings: saved, change: "add", user: dan });

        expect(presenter.getExclusions()).toBe(saved.exclusions);
        expect(presenter.vm.tab).toBe("active");
        expect(presenter.getUserName("user-dan")).toEqual({
            userId: "user-dan",
            label: "Dan Novak",
            state: "found"
        });
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Dan Novak", "user-ana"]);
    });

    it("keeps the tab after an edit and after a remove", async () => {
        const { presenter } = createExclusionsPageSetup([
            createAnaExclusion(),
            createCidExclusion()
        ]);
        await presenter.init(MANAGE);
        presenter.setTab("expired");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion(), createCidExclusion()] },
            change: "edit",
            user: null
        });
        expect(presenter.vm.tab).toBe("expired");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion()] },
            change: "remove",
            user: null
        });
        expect(presenter.vm.tab).toBe("expired");
    });

    it("resets a user filter whose user left the list", async () => {
        const { presenter } = createExclusionsPageSetup([
            createAnaExclusion(),
            createBenExclusion()
        ]);
        await presenter.init(MANAGE);
        presenter.setUserFilter("user-ben");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion()] },
            change: "remove",
            user: null
        });

        expect(presenter.vm.filter.value).toBeNull();
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);
    });

    it("keeps a user filter whose user is still in the list", async () => {
        const { presenter } = createExclusionsPageSetup([
            createAnaExclusion(),
            createBenExclusion()
        ]);
        await presenter.init(MANAGE);
        presenter.setUserFilter("user-ben");

        presenter.applySaved({
            settings: { exclusions: [createBenExclusion()] },
            change: "remove",
            user: null
        });

        expect(presenter.vm.filter.value).toBe("user-ben");
    });

    it("does not close the dialog in applySaved (the dialog presenter does)", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);
        presenter.openEdit("user-ana");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion()] },
            change: "edit",
            user: null
        });

        expect(presenter.vm.dialog).toEqual({ kind: "edit", userId: "user-ana" });
    });

    it("replaces an open Edit with Remove through openRemove (Remove entry, R324)", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);
        presenter.openEdit("user-ana");

        presenter.openRemove("user-ana");

        expect(presenter.vm.dialog).toEqual({ kind: "remove", userId: "user-ana" });
    });
});
