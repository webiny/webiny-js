import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import type { ExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";

const TRANSPORT_ALERT = "The server did not respond, so nothing was changed. Try again.";
const IVAN = createWorkflowUserSummary({
    id: "user-ivan",
    displayName: "Ivan Horvat",
    teamIds: []
});

const openEdit = (setup: ExclusionDialogSetup): FakeExclusionsSource => {
    const source = createFakeExclusionsSource({
        exclusions: [createAnaExclusion()],
        timeZone: ZAGREB
    });
    setup.presenter.init({ source, mode: "edit", userId: "user-ana" });
    return source;
};

describe("ExclusionDialogPresenter: failures (R325, Q68.2, Review Focus 7)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
        setup.config.listUsers.mockResolvedValue({ users: [IVAN], missingIds: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows the transport alert and keeps every entered value in Add", async () => {
        const source = createFakeExclusionsSource({
            exclusions: [createAnaExclusion()],
            timeZone: ZAGREB
        });
        setup.presenter.init({ source, mode: "add", userId: null });
        await vi.waitFor(() => expect(setup.presenter.vm.user.options).toHaveLength(1));
        setup.presenter.setUser("user-ivan");
        setup.presenter.setReason("Holiday");
        setup.presenter.setDate("2026-10-24");
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));

        await setup.presenter.submit();

        const vm = setup.presenter.vm;
        expect(vm.alert).toBe(TRANSPORT_ALERT);
        expect(vm.user.value).toBe("user-ivan");
        expect(vm.reason).toBe("Holiday");
        expect(vm.date).toBe("2026-10-24");
        expect(vm.saving).toBe(false);
        expect(vm.confirmLabel).toBe("Add exclusion");
        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.toasts.error).not.toHaveBeenCalled();
    });

    it("shows the server's message for a server error (Q68.2)", async () => {
        openEdit(setup);
        const error = new GraphQLOperationError({
            message: "This user is already in the list. Edit it instead.",
            code: SettingsErrorCode.Validation
        });
        setup.settings.updateSettings.mockRejectedValueOnce(error);

        await setup.presenter.submit();

        expect(setup.presenter.vm.alert).toBe(
            "Could not save: This user is already in the list. Edit it instead."
        );
    });

    it("shows a NotAuthorized refusal as a server error in the dialog", async () => {
        openEdit(setup);
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: SettingsErrorCode.NotAuthorized
        });
        setup.settings.updateSettings.mockRejectedValueOnce(error);

        await setup.presenter.submit();

        expect(setup.presenter.vm.alert).toBe("Could not save: Not authorized.");
    });

    it("keeps the alert while a field is edited and clears it with the next submit", async () => {
        openEdit(setup);
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));
        await setup.presenter.submit();

        setup.presenter.setReason("Holiday");
        expect(setup.presenter.vm.alert).toBe(TRANSPORT_ALERT);

        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();
        expect(setup.presenter.vm.alert).toBeNull();
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await submit;
    });

    it("ignores a second submit while saving and shows Saving…", async () => {
        openEdit(setup);
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);

        const first = setup.presenter.submit();
        const second = setup.presenter.submit();

        expect(setup.settings.updateSettings).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.saving).toBe(true);
        expect(setup.presenter.vm.confirmLabel).toBe("Saving…");
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await Promise.all([first, second]);
        expect(setup.toasts.success).toHaveBeenCalledTimes(1);
    });

    it("ignores Cancel and Remove entry while saving", async () => {
        const source = openEdit(setup);
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();

        setup.presenter.cancel();
        setup.presenter.removeEntry();

        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(source.openRemove).not.toHaveBeenCalled();
        pending.reject(new Error("Network down."));
        await submit;

        setup.presenter.cancel();
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
    });

    it("keeps the reason and the date while saving (Review Focus 7)", async () => {
        openEdit(setup);
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();

        setup.presenter.setReason("Changed");
        setup.presenter.setDate("2026-10-24");
        expect(setup.presenter.vm.reason).toBe("On leave");
        expect(setup.presenter.vm.date).toBe("2026-10-20");
        setup.presenter.clearDate();
        setup.presenter.setDate("");
        expect(setup.presenter.vm.date).toBe("2026-10-20");

        pending.reject(new Error("Network down."));
        await submit;
        setup.presenter.setReason("Changed");
        setup.presenter.clearDate();
        expect(setup.presenter.vm.reason).toBe("Changed");
        expect(setup.presenter.vm.date).toBeNull();
    });

    it("keeps the picked user while saving in Add", async () => {
        const source = createFakeExclusionsSource({
            exclusions: [createAnaExclusion()],
            timeZone: ZAGREB
        });
        setup.presenter.init({ source, mode: "add", userId: null });
        await vi.waitFor(() => expect(setup.presenter.vm.user.options).toHaveLength(1));
        setup.presenter.setUser("user-ivan");
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();

        setup.presenter.setUser(null);

        expect(setup.presenter.vm.user.value).toBe("user-ivan");
        pending.reject(new Error("Network down."));
        await submit;
        setup.presenter.setUser(null);
        expect(setup.presenter.vm.user.value).toBeNull();
    });

    it("closes on Cancel", () => {
        const source = openEdit(setup);

        setup.presenter.cancel();

        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();
    });

    it("touches nothing when a save settles after dispose", async () => {
        const source = openEdit(setup);
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();

        setup.presenter.dispose();
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await submit;

        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.presenter.vm.saving).toBe(false);
    });
});
