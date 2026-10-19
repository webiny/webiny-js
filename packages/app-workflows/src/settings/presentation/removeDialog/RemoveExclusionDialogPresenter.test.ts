import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
import { RemoveExclusionDialogPresenterFeature } from "~/settings/presentation/removeDialog/feature.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import { createFakeSettingsUseCases } from "~/settings/testing/fakeWorkflowSettingsUseCases.js";
import type { FakeWorkflowSettingsUseCases } from "~/settings/testing/fakeWorkflowSettingsUseCases.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";

const TRANSPORT_ALERT = "The server did not respond, so nothing was changed. Try again.";

const BEN_NAME: ExclusionUserName = { userId: "user-ben", label: "Ben Babić", state: "found" };

interface RemoveSetup {
    presenter: RemoveExclusionDialogPresenter.Interface;
    settings: FakeWorkflowSettingsUseCases;
    toasts: FakeWorkflowEditorToasts;
}

// A Remove dialog presenter over fakes; `updateSettings` echoes the list it was sent.
const createRemoveSetup = (): RemoveSetup => {
    const settings = createFakeSettingsUseCases();
    settings.updateSettings.mockImplementation(async data => data);
    const toasts = createFakeEditorToasts();
    const container = new Container();
    container.registerInstance(WorkflowSettingsUseCases, settings);
    container.registerInstance(WorkflowEditorToasts, toasts);
    RemoveExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(RemoveExclusionDialogPresenter);
    return { presenter, settings, toasts };
};

const openRemove = (
    setup: RemoveSetup,
    userId: string,
    names: ExclusionUserName[] = [BEN_NAME]
): FakeExclusionsSource => {
    const source = createFakeExclusionsSource({
        exclusions: [createAnaExclusion(), createBenExclusion(), createCidExclusion()],
        timeZone: ZAGREB,
        names
    });
    setup.presenter.init({ source, userId });
    return source;
};

describe("RemoveExclusionDialogPresenter (R318, R326, R327)", () => {
    let setup: RemoveSetup;

    beforeEach(() => {
        setup = createRemoveSetup();
    });

    it("asks to remove the named user", () => {
        openRemove(setup, "user-ben");

        expect(setup.presenter.vm).toEqual({
            title: "Remove exclusion?",
            body: "Ben Babić can be assigned automatically again. Nothing changes for work they already hold.",
            alert: null,
            removing: false
        });
    });

    it("names an unresolved user by the raw id", () => {
        openRemove(setup, "user-cid", []);

        expect(setup.presenter.vm.body).toBe(
            "user-cid can be assigned automatically again. Nothing changes for work they already hold."
        );
    });

    it("explains that removing a deleted user's entry changes nothing else (QBZ-91)", () => {
        openRemove(setup, "user-ben", [
            { userId: "user-ben", label: "Deleted user", state: "deleted" }
        ]);

        expect(setup.presenter.vm.body).toBe(
            "This user no longer exists, so removing the entry changes nothing else."
        );
    });

    it("sends the list without the entry and every other entry unchanged, in order (R318)", async () => {
        openRemove(setup, "user-ben");

        await setup.presenter.confirm();

        expect(setup.settings.updateSettings).toHaveBeenCalledTimes(1);
        expect(setup.settings.updateSettings).toHaveBeenCalledWith({
            exclusions: [createAnaExclusion(), createCidExclusion()]
        });
    });

    it("removes a deleted user's entry (Q64)", async () => {
        openRemove(setup, "user-ben", [
            { userId: "user-ben", label: "Deleted user", state: "deleted" }
        ]);

        await setup.presenter.confirm();

        expect(setup.settings.updateSettings).toHaveBeenCalledWith({
            exclusions: [createAnaExclusion(), createCidExclusion()]
        });
    });

    it("hands the saved record to the page, toasts Exclusion removed and closes (R327)", async () => {
        const source = openRemove(setup, "user-ben");
        const saved = { exclusions: [createAnaExclusion(), createCidExclusion()] };
        setup.settings.updateSettings.mockResolvedValueOnce(saved);

        await setup.presenter.confirm();

        expect(source.applySaved).toHaveBeenCalledWith({
            settings: saved,
            change: "remove",
            user: null
        });
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.toasts.success).toHaveBeenCalledWith("Exclusion removed");
        expect(setup.presenter.vm.removing).toBe(false);
    });

    it("closes on Cancel", () => {
        const source = openRemove(setup, "user-ben");

        setup.presenter.cancel();

        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();
    });
});

describe("RemoveExclusionDialogPresenter: failures (R325, QBZ-74, Review Focus 7)", () => {
    let setup: RemoveSetup;

    beforeEach(() => {
        setup = createRemoveSetup();
    });

    it("shows the transport alert and keeps the row", async () => {
        const source = openRemove(setup, "user-ben");
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));

        await setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBe(TRANSPORT_ALERT);
        expect(setup.presenter.vm.removing).toBe(false);
        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.toasts.error).not.toHaveBeenCalled();
    });

    it("shows the server's message for a server error (Q68.2)", async () => {
        openRemove(setup, "user-ben");
        const error = new GraphQLOperationError({
            message: "Could not save the workflow settings.",
            code: SettingsErrorCode.Persistence
        });
        setup.settings.updateSettings.mockRejectedValueOnce(error);

        await setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBe(
            "Could not save: Could not save the workflow settings."
        );
    });

    it("clears the alert with the next confirm", async () => {
        openRemove(setup, "user-ben");
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));
        await setup.presenter.confirm();

        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBeNull();
        expect(setup.presenter.vm.removing).toBe(true);
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await confirm;
    });

    it("ignores a second confirm while removing", async () => {
        openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);

        const first = setup.presenter.confirm();
        const second = setup.presenter.confirm();

        expect(setup.settings.updateSettings).toHaveBeenCalledTimes(1);
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await Promise.all([first, second]);
        expect(setup.toasts.success).toHaveBeenCalledTimes(1);
    });

    it("ignores Cancel, Close and Escape while removing", async () => {
        const source = openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        setup.presenter.cancel();

        expect(source.closeDialog).not.toHaveBeenCalled();
        pending.reject(new Error("Network down."));
        await confirm;

        setup.presenter.cancel();
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
    });

    it("touches nothing when a remove settles after dispose", async () => {
        const source = openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        setup.presenter.dispose();
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await confirm;

        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.presenter.vm.removing).toBe(false);
    });
});
